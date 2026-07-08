from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0006_alter_session_date"),
    ]

    operations = [
        migrations.CreateModel(
            name="SessionSettlement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("from_player", models.CharField(max_length=100)),
                ("to_player", models.CharField(max_length=100)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=10)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="settlements",
                        to="ledger.session",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="SessionAuditEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("actor_id", models.CharField(blank=True, db_index=True, max_length=64)),
                ("action", models.CharField(max_length=50)),
                ("message", models.TextField()),
                ("details", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="audit_entries",
                        to="ledger.session",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
