from django.db import migrations, models
import ledger.models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0007_sessionsettlement_sessionauditentry"),
    ]

    operations = [
        migrations.CreateModel(
            name="LedgerUser",
            fields=[
                ("clerk_id", models.CharField(max_length=64, primary_key=True, serialize=False)),
                ("default_currency", models.CharField(default="GBP", max_length=3)),
                ("chip_default_values", models.JSONField(default=ledger.models.default_chip_values)),
                ("session_sort_order", models.CharField(default="desc", max_length=4)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
