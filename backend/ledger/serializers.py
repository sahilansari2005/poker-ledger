from decimal import Decimal

from rest_framework import serializers
from .models import (
    ChangeRequest,
    LedgerUser,
    Table,
    TableMember,
    TableMembership,
    TableTransfer,
    Session,
    SessionPlayer,
    SessionSettlement,
    SessionAuditEntry,
)

ALLOWED_CURRENCIES = {
    "GBP", "USD", "EUR", "CAD", "AUD", "AED", "INR", "SGD", "CHF", "JPY", "NZD", "HKD",
}


class TableMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableMember
        fields = ("id", "name")


class TableTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableTransfer
        fields = ("id", "from_player", "to_player", "amount", "note", "created_at")
        read_only_fields = fields


class TableSerializer(serializers.ModelSerializer):
    members = TableMemberSerializer(many=True, read_only=True)
    transfers = TableTransferSerializer(many=True, read_only=True)
    role = serializers.SerializerMethodField()
    member_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Table
        # share_token must never appear here — members would see the invite link.
        fields = ("id", "owner_id", "name", "default_buy_in", "currency", "role", "members", "transfers", "member_names", "created_at")
        read_only_fields = ("id", "owner_id", "created_at")

    def get_role(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None
        return "owner" if obj.owner_id == request.user.pk else "viewer"

    def validate_currency(self, value):
        code = (value or "GBP").upper()
        if code not in ALLOWED_CURRENCIES:
            raise serializers.ValidationError(f"Unsupported currency: {value}")
        return code

    def create(self, validated_data):
        member_names = validated_data.pop("member_names", [])
        table = Table.objects.create(**validated_data)
        for name in member_names:
            TableMember.objects.create(table=table, name=name)
        return table

    def update(self, instance, validated_data):
        member_names = validated_data.pop("member_names", None)
        instance.name = validated_data.get("name", instance.name)
        instance.default_buy_in = validated_data.get("default_buy_in", instance.default_buy_in)
        if "currency" in validated_data:
            instance.currency = validated_data["currency"]
        instance.save()

        if member_names is not None:
            instance.members.all().delete()
            for name in member_names:
                TableMember.objects.create(table=instance, name=name)

        return instance


class SessionPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionPlayer
        fields = ("id", "name", "total_buy_in", "cash_out")


class SessionSettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionSettlement
        fields = ("id", "from_player", "to_player", "amount", "order")


class SessionAuditEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionAuditEntry
        fields = ("id", "actor_id", "action", "message", "details", "created_at")
        read_only_fields = fields


class SessionSerializer(serializers.ModelSerializer):
    players = SessionPlayerSerializer(many=True, read_only=True)
    table_currency = serializers.CharField(source="table.currency", read_only=True)
    player_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Session
        fields = ("id", "table", "table_currency", "date", "is_completed", "players", "player_names", "created_at")
        read_only_fields = ("id", "table", "is_completed", "created_at")

    def create(self, validated_data):
        player_names = validated_data.pop("player_names", [])
        session = Session.objects.create(**validated_data)
        default_buy_in = session.table.default_buy_in
        for name in player_names:
            SessionPlayer.objects.create(
                session=session,
                name=name,
                total_buy_in=default_buy_in,
            )
        return session


class SessionDetailSerializer(SessionSerializer):
    settlements = SessionSettlementSerializer(many=True, read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta(SessionSerializer.Meta):
        fields = SessionSerializer.Meta.fields + ("settlements", "can_edit")

    def get_can_edit(self, obj):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return obj.table.owner_id == request.user.pk


class SharedTableSerializer(serializers.ModelSerializer):
    """Public read-only shape served to anyone holding the share link."""

    members = TableMemberSerializer(many=True, read_only=True)
    transfers = TableTransferSerializer(many=True, read_only=True)

    class Meta:
        model = Table
        # Deliberately omits owner_id and share_token.
        fields = ("id", "name", "default_buy_in", "currency", "members", "transfers", "created_at")
        read_only_fields = fields


class TableMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = TableMembership
        fields = ("id", "user_id", "user_email", "role", "created_at")
        read_only_fields = fields


class ChangeRequestSerializer(serializers.ModelSerializer):
    requester_email = serializers.EmailField(source="requester.email", read_only=True)
    session = serializers.PrimaryKeyRelatedField(
        queryset=Session.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = ChangeRequest
        fields = (
            "id",
            "table",
            "session",
            "requester_id",
            "requester_email",
            "message",
            "status",
            "resolution_note",
            "created_at",
            "resolved_at",
        )
        read_only_fields = ("id", "table", "requester_id", "status", "resolution_note", "created_at", "resolved_at")

    def validate_session(self, value):
        table = self.context.get("table")
        if value is not None and table is not None and value.table_id != table.id:
            raise serializers.ValidationError("Session does not belong to this table.")
        return value

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()


class ResolveRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[ChangeRequest.STATUS_RESOLVED, ChangeRequest.STATUS_REJECTED])
    resolution_note = serializers.CharField(required=False, allow_blank=True, default="")


class AddBuyInSerializer(serializers.Serializer):
    player_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class AddPlayerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)


class CashOutPlayerSerializer(serializers.Serializer):
    player_id = serializers.IntegerField()
    cash_out = serializers.DecimalField(max_digits=10, decimal_places=2)


class CompleteSessionSerializer(serializers.Serializer):
    cash_outs = CashOutPlayerSerializer(many=True)
    allow_discrepancy = serializers.BooleanField(required=False, default=False)


class IngestPlayerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    total_buy_in = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0"))
    cash_out = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0"))


class IngestSessionSerializer(serializers.Serializer):
    date = serializers.DateField()
    players = IngestPlayerSerializer(many=True, min_length=1)


class IngestTransferSerializer(serializers.Serializer):
    from_player = serializers.CharField(max_length=100)
    to_player = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    note = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")


class IngestTableSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    default_buy_in = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0"), required=False, default=Decimal("20.00"))
    currency = serializers.CharField(max_length=3)
    member_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )
    sessions = IngestSessionSerializer(many=True, required=False, default=list)
    transfers = IngestTransferSerializer(many=True, required=False, default=list)

    def validate_currency(self, value):
        code = (value or "GBP").upper()
        if code not in ALLOWED_CURRENCIES:
            raise serializers.ValidationError(f"Unsupported currency: {value}")
        return code


class IngestPayloadSerializer(serializers.Serializer):
    tables = IngestTableSerializer(many=True, min_length=1)


class LedgerUserSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = LedgerUser
        fields = (
            "user_id",
            "default_currency",
            "chip_default_values",
            "session_sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user_id", "created_at", "updated_at")

    def validate_default_currency(self, value):
        code = (value or "GBP").upper()
        if code not in ALLOWED_CURRENCIES:
            raise serializers.ValidationError(f"Unsupported currency: {value}")
        return code

    def validate_chip_default_values(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("Add at least one chip value.")
        cleaned = []
        for item in value:
            try:
                amount = float(item)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError("Each chip value must be a number.") from exc
            if amount < 0:
                raise serializers.ValidationError("Chip values must be zero or positive.")
            cleaned.append(f"{amount:g}" if amount == int(amount) else str(amount))
        return cleaned

    def validate_session_sort_order(self, value):
        order = (value or "desc").lower()
        if order not in {"asc", "desc"}:
            raise serializers.ValidationError("Sort order must be 'asc' or 'desc'.")
        return order
