from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def clear_user_scoped_data(apps, schema_editor):
    Table = apps.get_model("ledger", "Table")
    LedgerUser = apps.get_model("ledger", "LedgerUser")
    Table.objects.all().delete()
    LedgerUser.objects.all().delete()


def create_default_site(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    Site.objects.update_or_create(
        pk=settings.SITE_ID,
        defaults={"domain": "localhost:8000", "name": "Poker Ledger"},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("sites", "0002_alter_domain_unique"),
        ("ledger", "0009_rename_ledgeruser_clerk_id_user_id"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(clear_user_scoped_data, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="ledgeruser",
            name="user_id",
        ),
        migrations.AddField(
            model_name="ledgeruser",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ledger_profile",
                to=settings.AUTH_USER_MODEL,
                null=True,
            ),
        ),
        migrations.RemoveField(
            model_name="table",
            name="owner_id",
        ),
        migrations.AddField(
            model_name="table",
            name="owner",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tables",
                to=settings.AUTH_USER_MODEL,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="ledgeruser",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="ledger_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="table",
            name="owner",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tables",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(create_default_site, migrations.RunPython.noop),
    ]
