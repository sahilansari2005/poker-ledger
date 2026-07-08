from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0008_ledgeruser"),
    ]

    operations = [
        migrations.RenameField(
            model_name="ledgeruser",
            old_name="clerk_id",
            new_name="user_id",
        ),
        migrations.AlterField(
            model_name="ledgeruser",
            name="user_id",
            field=models.CharField(max_length=128, primary_key=True, serialize=False),
        ),
    ]
