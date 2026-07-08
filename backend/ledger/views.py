from decimal import Decimal

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from . import cache_utils as cache
from .audit import log_session_audit
from .models import Table, Session, SessionPlayer, SessionSettlement
from .serializers import (
    TableSerializer,
    SessionSerializer,
    SessionDetailSerializer,
    SessionPlayerSerializer,
    SessionAuditEntrySerializer,
    AddBuyInSerializer,
    AddPlayerSerializer,
    CompleteSessionSerializer,
)
from .settlement import compute_settlements

SESSION_ORDERING = set(cache.SESSION_ORDERINGS)


def _persist_settlements(session):
    players = list(session.players.all())
    session.settlements.all().delete()
    settlements = compute_settlements(players)
    SessionSettlement.objects.bulk_create(
        [
            SessionSettlement(
                session=session,
                from_player=item["from_player"],
                to_player=item["to_player"],
                amount=item["amount"],
                order=index,
            )
            for index, item in enumerate(settlements)
        ]
    )
    return settlements


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer

    def get_queryset(self):
        return Table.objects.filter(owner=self.request.user).prefetch_related("members", "transfers")

    def list(self, request, *args, **kwargs):
        owner_id = request.user.pk
        key = cache.tables_list_key(owner_id)
        cached = cache.cache_get(key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        cache.cache_set(key, response.data)
        return response

    def retrieve(self, request, *args, **kwargs):
        owner_id = request.user.pk
        table_id = kwargs.get("pk")
        key = cache.table_key(owner_id, table_id)
        cached = cache.cache_get(key)
        if cached is not None:
            return Response(cached)

        response = super().retrieve(request, *args, **kwargs)
        cache.cache_set(key, response.data)
        return response

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        cache.invalidate_tables_list(self.request.user.pk)

    def perform_update(self, serializer):
        table = serializer.save()
        cache.invalidate_table(self.request.user.pk, table.id)

    def perform_destroy(self, instance):
        owner_id = self.request.user.pk
        table_id = instance.id
        instance.delete()
        cache.invalidate_table(owner_id, table_id)

    @action(detail=True, methods=["get", "post"], url_path="sessions")
    def sessions(self, request, pk=None):
        table = self.get_object()
        owner_id = request.user.pk

        if request.method == "GET":
            ordering = request.query_params.get("ordering", "-date")
            if ordering not in SESSION_ORDERING:
                ordering = "-date"

            key = cache.sessions_list_key(owner_id, table.id, ordering)
            cached = cache.cache_get(key)
            if cached is not None:
                return Response(cached)

            sessions = table.sessions.prefetch_related("players").order_by(ordering, "-created_at")
            data = SessionSerializer(sessions, many=True).data
            cache.cache_set(key, data)
            return Response(data)

        serializer = SessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(table=table)
        player_names = request.data.get("player_names", [])
        log_session_audit(
            session,
            actor_id=str(owner_id),
            action="session_created",
            message=f"Session started with {len(player_names)} player(s).",
            details={
                "date": str(session.date),
                "player_names": player_names,
            },
        )
        cache.invalidate_table(owner_id, table.id)
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SessionViewSet(viewsets.GenericViewSet):
    serializer_class = SessionSerializer

    def get_queryset(self):
        return (
            Session.objects.filter(table__owner=self.request.user)
            .select_related("table")
            .prefetch_related("players", "settlements")
        )

    def retrieve(self, request, pk=None):
        owner_id = request.user.pk
        key = cache.session_key(owner_id, pk)
        cached = cache.cache_get(key)
        if cached is not None:
            return Response(cached)

        session = self.get_object()
        data = SessionDetailSerializer(session).data
        cache.cache_set(key, data)
        return Response(data)

    def destroy(self, request, pk=None):
        session = self.get_object()
        owner_id = request.user.pk
        table_id = session.table_id
        session_id = session.id
        session.delete()
        cache.invalidate_session(owner_id, session_id, table_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, pk=None):
        session = self.get_object()
        allowed = {"date"}
        if set(request.data.keys()) - allowed:
            return Response({"detail": "Only the session date can be updated."}, status=status.HTTP_400_BAD_REQUEST)

        old_date = session.date
        serializer = SessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()

        if "date" in request.data and str(old_date) != str(session.date):
            log_session_audit(
                session,
                actor_id=str(request.user.pk),
                action="date_changed",
                message=f"Session date changed from {old_date} to {session.date}.",
                details={"old_date": str(old_date), "new_date": str(session.date)},
            )

        owner_id = request.user.pk
        cache.invalidate_session(owner_id, session.id, session.table_id)
        data = SessionDetailSerializer(session).data
        cache.cache_set(cache.session_key(owner_id, session.id), data)
        return Response(data)

    def _invalidate_session_cache(self, session):
        cache.invalidate_session(self.request.user.pk, session.id, session.table_id)

    @action(detail=True, methods=["get"], url_path="audit-log")
    def audit_log(self, request, pk=None):
        session = self.get_object()
        entries = session.audit_entries.all()
        return Response(SessionAuditEntrySerializer(entries, many=True).data)

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

        amount = serializer.validated_data["amount"]
        previous_total = player.total_buy_in
        player.total_buy_in += amount
        player.save()

        log_session_audit(
            session,
            actor_id=str(request.user.pk),
            action="buy_in_added",
            message=f"{player.name} bought in {amount} (total now {player.total_buy_in}).",
            details={
                "player_id": player.id,
                "player_name": player.name,
                "amount": str(amount),
                "previous_total_buy_in": str(previous_total),
                "total_buy_in": str(player.total_buy_in),
            },
        )

        self._invalidate_session_cache(session)
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

        log_session_audit(
            session,
            actor_id=str(request.user.pk),
            action="player_added",
            message=f"{player.name} joined the session.",
            details={"player_id": player.id, "player_name": player.name},
        )

        self._invalidate_session_cache(session)
        return Response(SessionPlayerSerializer(player).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        session = self.get_object()
        if session.is_completed:
            return Response({"detail": "Session is already completed."}, status=400)

        serializer = CompleteSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cash_outs = {c["player_id"]: c["cash_out"] for c in serializer.validated_data["cash_outs"]}
        allow_discrepancy = serializer.validated_data.get("allow_discrepancy", False)

        players = list(session.players.all())
        total_buy_in = sum(p.total_buy_in for p in players)
        total_cash_out = sum(cash_outs.get(p.id, 0) for p in players)
        discrepancy = abs(total_buy_in - total_cash_out)

        if not allow_discrepancy and discrepancy > Decimal("0.01"):
            return Response(
                {"detail": f"Buy-in total ({total_buy_in}) does not match cash-out total ({total_cash_out})."},
                status=400,
            )

        cash_out_details = []
        for player in players:
            if player.id in cash_outs:
                player.cash_out = cash_outs[player.id]
                player.save()
                cash_out_details.append(
                    {
                        "player_id": player.id,
                        "player_name": player.name,
                        "cash_out": str(player.cash_out),
                        "total_buy_in": str(player.total_buy_in),
                    }
                )

        session.is_completed = True
        session.save()

        settlements = _persist_settlements(session)

        action_name = "session_completed_with_discrepancy" if discrepancy > Decimal("0.01") else "session_completed"
        message = "Session completed."
        if discrepancy > Decimal("0.01"):
            message = f"Session completed with {discrepancy.quantize(Decimal('0.01'))} discrepancy."

        log_session_audit(
            session,
            actor_id=str(request.user.pk),
            action=action_name,
            message=message,
            details={
                "allow_discrepancy": allow_discrepancy,
                "discrepancy": str(discrepancy.quantize(Decimal("0.01"))),
                "total_buy_in": str(total_buy_in),
                "total_cash_out": str(total_cash_out),
                "cash_outs": cash_out_details,
                "settlement_count": len(settlements),
            },
        )

        self._invalidate_session_cache(session)
        session = self.get_queryset().get(pk=session.pk)
        return Response(SessionDetailSerializer(session).data)
