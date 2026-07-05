# Generated manually for auth removal

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("ledger", "0002_alter_table_owner_tablecollaborator_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="table",
            name="collaborators",
        ),
        migrations.DeleteModel(
            name="TableCollaborator",
        ),
        migrations.RemoveField(
            model_name="table",
            name="owner",
        ),
    ]
