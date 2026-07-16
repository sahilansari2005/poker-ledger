from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0016_table_default_buy_in_default_zero"),
    ]

    operations = [
        migrations.AddField(
            model_name="table",
            name="default_buy_in_b",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
