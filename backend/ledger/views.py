from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Table, Session, SessionPlayer
from .serializers import (
    TableSerializer,
    SessionSerializer,
    SessionPlayerSerializer,
    AddBuyInSerializer,
    AddPlayerSerializer,
    CompleteSessionSerializer,
)


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer

    def get_queryset(self):
        return Table.objects.filter(owner_id=self.request.user.id).prefetch_related("members")

    def perform_create(self, serializer):
        serializer.save(owner_id=self.request.user.id)

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

    def get_queryset(self):
        return (
            Session.objects.filter(table__owner_id=self.request.user.id)
            .select_related("table")
            .prefetch_related("players")
        )

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
                {"detail": f"Buy-in total ({total_buy_in}) does not match cash-out total ({total_cash_out})."},
                status=400,
            )

        for player in session.players.all():
            if player.id in cash_outs:
                player.cash_out = cash_outs[player.id]
                player.save()

        session.is_completed = True
        session.save()
        return Response(SessionSerializer(session).data)
