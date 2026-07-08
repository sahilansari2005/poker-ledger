from django.db import migrations


# Tables that own data directly (have owner_id or user_id pointing at auth.User)
# and nested tables that inherit ownership through a parent FK.
#
# Two PERMISSIVE policies are added to every table:
#
#   rls_bypass_for_admin  — passes when app.current_user_id is not set (NULL/empty).
#                           This lets management commands (migrate, collectstatic, etc.)
#                           read and write without restriction, because those processes
#                           never run through the Django middleware that sets the variable.
#
#   rls_owner_isolation   — passes when the row's owner FK matches the current user.
#                           Web requests always have the variable set (to the real user PK,
#                           or '0' for anonymous), so the bypass policy never fires there.
#
# With FORCE ROW LEVEL SECURITY the policies apply even to the table-owner DB role,
# closing the gap where the Render master user would otherwise bypass them.


def _user_id():
    """Reusable expression: cast the session variable to integer, or NULL if unset."""
    return "NULLIF(current_setting('app.current_user_id', TRUE), '')::integer"


def _bypass():
    """Reusable expression: TRUE when the session variable is not set."""
    return "NULLIF(current_setting('app.current_user_id', TRUE), '') IS NULL"


def enable_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    uid = _user_id()
    bypass = _bypass()

    statements = [
        # ── ledger_table ──────────────────────────────────────────────────────
        "ALTER TABLE ledger_table ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_table FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_table USING ({bypass})",
        f"CREATE POLICY rls_owner_isolation  ON ledger_table USING (owner_id = {uid})",

        # ── ledger_ledgeruser ─────────────────────────────────────────────────
        "ALTER TABLE ledger_ledgeruser ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_ledgeruser FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_ledgeruser USING ({bypass})",
        f"CREATE POLICY rls_owner_isolation  ON ledger_ledgeruser USING (user_id = {uid})",

        # ── ledger_tablemember ────────────────────────────────────────────────
        "ALTER TABLE ledger_tablemember ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_tablemember FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_tablemember USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_tablemember
            USING (table_id IN (
                SELECT id FROM ledger_table WHERE owner_id = {uid}
            ))""",

        # ── ledger_tabletransfer ──────────────────────────────────────────────
        "ALTER TABLE ledger_tabletransfer ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_tabletransfer FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_tabletransfer USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_tabletransfer
            USING (table_id IN (
                SELECT id FROM ledger_table WHERE owner_id = {uid}
            ))""",

        # ── ledger_session ────────────────────────────────────────────────────
        "ALTER TABLE ledger_session ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_session FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_session USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_session
            USING (table_id IN (
                SELECT id FROM ledger_table WHERE owner_id = {uid}
            ))""",

        # ── ledger_sessionplayer ──────────────────────────────────────────────
        "ALTER TABLE ledger_sessionplayer ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_sessionplayer FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_sessionplayer USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_sessionplayer
            USING (session_id IN (
                SELECT s.id FROM ledger_session s
                JOIN ledger_table t ON t.id = s.table_id
                WHERE t.owner_id = {uid}
            ))""",

        # ── ledger_sessionsettlement ──────────────────────────────────────────
        "ALTER TABLE ledger_sessionsettlement ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_sessionsettlement FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_sessionsettlement USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_sessionsettlement
            USING (session_id IN (
                SELECT s.id FROM ledger_session s
                JOIN ledger_table t ON t.id = s.table_id
                WHERE t.owner_id = {uid}
            ))""",

        # ── ledger_sessionauditentry ──────────────────────────────────────────
        "ALTER TABLE ledger_sessionauditentry ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_sessionauditentry FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_sessionauditentry USING ({bypass})",
        f"""CREATE POLICY rls_owner_isolation ON ledger_sessionauditentry
            USING (session_id IN (
                SELECT s.id FROM ledger_session s
                JOIN ledger_table t ON t.id = s.table_id
                WHERE t.owner_id = {uid}
            ))""",
    ]

    with schema_editor.connection.cursor() as cursor:
        for sql in statements:
            cursor.execute(sql)


def disable_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    tables = [
        "ledger_table",
        "ledger_ledgeruser",
        "ledger_tablemember",
        "ledger_tabletransfer",
        "ledger_session",
        "ledger_sessionplayer",
        "ledger_sessionsettlement",
        "ledger_sessionauditentry",
    ]

    with schema_editor.connection.cursor() as cursor:
        for table in tables:
            cursor.execute(f"DROP POLICY IF EXISTS rls_bypass_for_admin ON {table}")
            cursor.execute(f"DROP POLICY IF EXISTS rls_owner_isolation  ON {table}")
            cursor.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")


class Migration(migrations.Migration):
    dependencies = [
        ("ledger", "0012_tabletransfer"),
    ]

    operations = [
        migrations.RunPython(enable_rls, disable_rls),
    ]
