from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0003_remove_auth_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="table",
            name="currency",
            field=models.CharField(default="GBP", max_length=3),
        ),
    ]
