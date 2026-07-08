from django.db import migrations, models
import ledger.models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0005_table_owner_id"),
    ]

    operations = [
        migrations.AlterField(
            model_name="session",
            name="date",
            field=models.DateField(default=ledger.models.default_session_date),
        ),
    ]
