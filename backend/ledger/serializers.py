from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Table, TableMember, TableCollaborator, Session, SessionPlayer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class TableMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableMember
        fields = ("id", "name")


class CollaboratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class TableSerializer(serializers.ModelSerializer):
    members = TableMemberSerializer(many=True, read_only=True)
    collaborators = CollaboratorSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    member_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Table
        fields = ("id", "name", "default_buy_in", "members", "collaborators", "is_owner", "member_names", "created_at")
        read_only_fields = ("id", "created_at")

    def get_is_owner(self, obj):
        request = self.context.get("request")
        return request and obj.owner_id == request.user.id

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
    player_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Session
        fields = ("id", "table", "date", "is_completed", "players", "player_names", "created_at")
        read_only_fields = ("id", "table", "date", "is_completed", "created_at")

    def create(self, validated_data):
        player_names = validated_data.pop("player_names", [])
        session = Session.objects.create(**validated_data)
        for name in player_names:
            SessionPlayer.objects.create(session=session, name=name)
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


class InviteCollaboratorSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
