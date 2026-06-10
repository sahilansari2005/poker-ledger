from django.db import models
from django.contrib.auth.models import User


class Table(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_tables")
    collaborators = models.ManyToManyField(User, through="TableCollaborator", related_name="shared_tables", blank=True)
    name = models.CharField(max_length=255)
    default_buy_in = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TableCollaborator(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name="table_collaborators")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collaborations")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("table", "user")


class TableMember(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name="members")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("table", "name")

    def __str__(self):
        return f"{self.name} @ {self.table.name}"


class Session(models.Model):
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name="sessions")
    date = models.DateField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} — {self.table.name} ({self.date})"


class SessionPlayer(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="players")
    name = models.CharField(max_length=100)
    total_buy_in = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cash_out = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.name} in session {self.session.id}"
