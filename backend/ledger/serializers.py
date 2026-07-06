from rest_framework import serializers
from .models import Table, TableMember, Session, SessionPlayer

ALLOWED_CURRENCIES = {
    "GBP", "USD", "EUR", "CAD", "AUD", "AED", "INR", "SGD", "CHF", "JPY", "NZD", "HKD",
}


class TableMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableMember
        fields = ("id", "name")


class TableSerializer(serializers.ModelSerializer):
    members = TableMemberSerializer(many=True, read_only=True)
    member_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Table
        fields = ("id", "owner_id", "name", "default_buy_in", "currency", "members", "member_names", "created_at")
        read_only_fields = ("id", "owner_id", "created_at")

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
        read_only_fields = ("id", "table", "date", "is_completed", "created_at")

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
