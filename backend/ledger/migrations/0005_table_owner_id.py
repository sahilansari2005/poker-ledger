from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0004_table_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="table",
            name="owner_id",
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
    ]
