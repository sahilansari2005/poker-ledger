from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0015_sharing_rls"),
    ]

    operations = [
        migrations.AlterField(
            model_name="table",
            name="default_buy_in",
            field=models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=10),
        ),
    ]
