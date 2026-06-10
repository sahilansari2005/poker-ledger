from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Table, TableCollaborator, Session, SessionPlayer
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    TableSerializer,
    SessionSerializer,
    SessionPlayerSerializer,
    AddBuyInSerializer,
    AddPlayerSerializer,
    CompleteSessionSerializer,
    InviteCollaboratorSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}

    def get_queryset(self):
        # Return tables the user owns OR has been invited to
        return (
            Table.objects.filter(
                Q(owner=self.request.user) | Q(collaborators=self.request.user)
            )
            .distinct()
            .prefetch_related("members", "collaborators")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def _is_owner(self, table):
        return table.owner == self.request.user

    def _has_access(self, table):
        return self._is_owner(table) or self.request.user in table.collaborators.all()

    def get_object(self):
        obj = super().get_object()
        if not self._has_access(obj):
            raise PermissionDenied
        return obj

    def update(self, request, *args, **kwargs):
        table = self.get_object()
        if not self._is_owner(table):
            raise PermissionDenied("Only the owner can edit this table.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        table = self.get_object()
        if not self._is_owner(table):
            raise PermissionDenied("Only the owner can delete this table.")
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="invite")
    def invite(self, request, pk=None):
        table = self.get_object()
        if not self._is_owner(table):
            raise PermissionDenied("Only the owner can invite collaborators.")

        serializer = InviteCollaboratorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": f"User '{username}' not found."}, status=404)

        if user == table.owner:
            return Response({"detail": "Owner is already on this table."}, status=400)

        TableCollaborator.objects.get_or_create(table=table, user=user)
        return Response(TableSerializer(table, context={"request": request}).data)

    @action(detail=True, methods=["delete"], url_path=r"collaborators/(?P<user_id>\d+)")
    def remove_collaborator(self, request, pk=None, user_id=None):
        table = self.get_object()
        if not self._is_owner(table):
            raise PermissionDenied("Only the owner can remove collaborators.")

        TableCollaborator.objects.filter(table=table, user_id=user_id).delete()
        return Response(TableSerializer(table, context={"request": request}).data)

    @action(detail=True, methods=["get", "post"], url_path="sessions")
    def sessions(self, request, pk=None):
        table = self.get_object()

        if request.method == "GET":
            sessions = table.sessions.prefetch_related("players").order_by("-created_at")
            return Response(SessionSerializer(sessions, many=True).data)

        serializer = SessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(table=table)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SessionViewSet(viewsets.GenericViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(
            Q(table__owner=self.request.user) | Q(table__collaborators=self.request.user)
        ).distinct().prefetch_related("players")

    def retrieve(self, request, pk=None):
        session = self.get_object()
        return Response(SessionSerializer(session).data)

    def destroy(self, request, pk=None):
        session = self.get_object()
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="buy-in")
    def buy_in(self, request, pk=None):
        session = self.get_object()
        if session.is_completed:
            return Response({"detail": "Session is already completed."}, status=400)

        serializer = AddBuyInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            player = session.players.get(id=serializer.validated_data["player_id"])
        except SessionPlayer.DoesNotExist:
            return Response({"detail": "Player not found in this session."}, status=404)

        player.total_buy_in += serializer.validated_data["amount"]
        player.save()
        return Response(SessionPlayerSerializer(player).data)

    @action(detail=True, methods=["post"], url_path="add-player")
    def add_player(self, request, pk=None):
        session = self.get_object()
        if session.is_completed:
            return Response({"detail": "Session is already completed."}, status=400)

        serializer = AddPlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        player = SessionPlayer.objects.create(
            session=session,
            name=serializer.validated_data["name"],
        )
        return Response(SessionPlayerSerializer(player).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.is_completed:
            return Response({"detail": "Session is already completed."}, status=400)

        serializer = CompleteSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cash_outs = {c["player_id"]: c["cash_out"] for c in serializer.validated_data["cash_outs"]}

        total_buy_in = sum(p.total_buy_in for p in session.players.all())
        total_cash_out = sum(cash_outs.get(p.id, 0) for p in session.players.all())

        if abs(total_buy_in - total_cash_out) > 0.01:
            return Response(
                {"detail": f"Buy-in total (£{total_buy_in}) does not match cash-out total (£{total_cash_out})."},
                status=400,
            )

        for player in session.players.all():
            if player.id in cash_outs:
                player.cash_out = cash_outs[player.id]
                player.save()

        session.is_completed = True
        session.save()
        return Response(SessionSerializer(session).data)
