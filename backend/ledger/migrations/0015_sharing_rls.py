from django.db import migrations


# Extends the RLS setup from 0013 for the sharing feature:
#
#   - ledger_tablemembership / ledger_changerequest get RLS with SELF-CONTAINED
#     policies (they check their own user_id/requester_id/owner_id columns and
#     never subquery ledger_table). This matters: ledger_table's new member-read
#     policy subqueries the membership table, so if membership's policy also
#     subqueried ledger_table, Postgres would abort with "infinite recursion
#     detected in policy". The denormalized owner_id column on both new tables
#     exists precisely to keep their policies self-contained.
#
#   - ledger_table gets two additional PERMISSIVE FOR SELECT policies:
#     members can read tables they belong to, and anonymous requests carrying a
#     valid share token (app.share_token GUC, set by SetRLSUserMiddleware for
#     /api/shared/<token>/ URLs) can read that one table. The existing
#     rls_owner_isolation policy remains the only policy covering writes.
#
#   - Child tables get a FOR SELECT policy of the form
#     "parent id IN (SELECT id FROM parent)". The subquery is itself filtered
#     by the parent's own policies, so it means "parent visible in this request
#     context" — owner, member, valid share token, or admin bypass alike.
#
#   - ledger_sessionauditentry is the exception: readable by members but NOT via
#     the anonymous token path (it exposes actor ids and no public endpoint
#     serves it), so its policy joins through the membership table directly.


def _user_id():
    return "NULLIF(current_setting('app.current_user_id', TRUE), '')::integer"


def _bypass():
    return "NULLIF(current_setting('app.current_user_id', TRUE), '') IS NULL"


def _share_token():
    return "NULLIF(current_setting('app.share_token', TRUE), '')"


def enable_sharing_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    uid = _user_id()
    bypass = _bypass()
    tok = _share_token()

    statements = [
        # ── ledger_tablemembership ────────────────────────────────────────────
        "ALTER TABLE ledger_tablemembership ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_tablemembership FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_tablemembership USING ({bypass})",
        f"""CREATE POLICY rls_membership_access ON ledger_tablemembership
            USING (user_id = {uid} OR owner_id = {uid})""",

        # ── ledger_changerequest ──────────────────────────────────────────────
        "ALTER TABLE ledger_changerequest ENABLE ROW LEVEL SECURITY",
        "ALTER TABLE ledger_changerequest FORCE ROW LEVEL SECURITY",
        f"CREATE POLICY rls_bypass_for_admin ON ledger_changerequest USING ({bypass})",
        f"""CREATE POLICY rls_request_access ON ledger_changerequest
            USING (requester_id = {uid} OR owner_id = {uid})""",

        # ── ledger_table: member + share-token read paths ─────────────────────
        f"""CREATE POLICY rls_member_read ON ledger_table FOR SELECT
            USING (EXISTS (
                SELECT 1 FROM ledger_tablemembership m
                WHERE m.table_id = ledger_table.id AND m.user_id = {uid}
            ))""",
        f"""CREATE POLICY rls_share_token_read ON ledger_table FOR SELECT
            USING (share_token IS NOT NULL AND share_token = {tok})""",

        # ── children of ledger_table ──────────────────────────────────────────
        """CREATE POLICY rls_shared_read ON ledger_session FOR SELECT
            USING (table_id IN (SELECT id FROM ledger_table))""",
        """CREATE POLICY rls_shared_read ON ledger_tablemember FOR SELECT
            USING (table_id IN (SELECT id FROM ledger_table))""",
        """CREATE POLICY rls_shared_read ON ledger_tabletransfer FOR SELECT
            USING (table_id IN (SELECT id FROM ledger_table))""",

        # ── children of ledger_session ────────────────────────────────────────
        """CREATE POLICY rls_shared_read ON ledger_sessionplayer FOR SELECT
            USING (session_id IN (SELECT id FROM ledger_session))""",
        """CREATE POLICY rls_shared_read ON ledger_sessionsettlement FOR SELECT
            USING (session_id IN (SELECT id FROM ledger_session))""",

        # ── audit log: members only, never the anonymous token path ───────────
        f"""CREATE POLICY rls_member_read ON ledger_sessionauditentry FOR SELECT
            USING (session_id IN (
                SELECT s.id FROM ledger_session s
                JOIN ledger_tablemembership m ON m.table_id = s.table_id
                WHERE m.user_id = {uid}
            ))""",
    ]

    with schema_editor.connection.cursor() as cursor:
        for sql in statements:
            cursor.execute(sql)


def disable_sharing_rls(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    statements = [
        "DROP POLICY IF EXISTS rls_member_read ON ledger_sessionauditentry",
        "DROP POLICY IF EXISTS rls_shared_read ON ledger_sessionsettlement",
        "DROP POLICY IF EXISTS rls_shared_read ON ledger_sessionplayer",
        "DROP POLICY IF EXISTS rls_shared_read ON ledger_tabletransfer",
        "DROP POLICY IF EXISTS rls_shared_read ON ledger_tablemember",
        "DROP POLICY IF EXISTS rls_shared_read ON ledger_session",
        "DROP POLICY IF EXISTS rls_share_token_read ON ledger_table",
        "DROP POLICY IF EXISTS rls_member_read ON ledger_table",
        "DROP POLICY IF EXISTS rls_request_access ON ledger_changerequest",
        "DROP POLICY IF EXISTS rls_bypass_for_admin ON ledger_changerequest",
        "ALTER TABLE ledger_changerequest DISABLE ROW LEVEL SECURITY",
        "DROP POLICY IF EXISTS rls_membership_access ON ledger_tablemembership",
        "DROP POLICY IF EXISTS rls_bypass_for_admin ON ledger_tablemembership",
        "ALTER TABLE ledger_tablemembership DISABLE ROW LEVEL SECURITY",
    ]

    with schema_editor.connection.cursor() as cursor:
        for sql in statements:
            cursor.execute(sql)


class Migration(migrations.Migration):
    dependencies = [
        ("ledger", "0014_sharing_models"),
    ]

    operations = [
        migrations.RunPython(enable_sharing_rls, disable_sharing_rls),
    ]
