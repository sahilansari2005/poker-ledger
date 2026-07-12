import re

from django.db import connection

# Matches the public share endpoints (/api/shared/<token>/...) so the token can
# be exposed to the RLS policies for anonymous read access.
SHARE_PATH_RE = re.compile(r"^/api/shared/(?P<token>[A-Za-z0-9_-]{20,64})(/|$)")


class SetRLSUserMiddleware:
    """
    Sets the PostgreSQL session variables app.current_user_id and app.share_token
    on every request.

    This is the companion to the Row Level Security policies in migrations 0013
    and 0015. The values are scoped to the connection session (is_local=FALSE) so
    they persist across all queries made during the request. Both are reset on
    every request because connections are reused (CONN_MAX_AGE) — a stale token
    from a previous request must never leak into the next one.

    - Authenticated request  → sets the real user PK (e.g. '42')
    - Unauthenticated request → sets '0', which matches no owner_id (Django PKs start at 1)
    - Request to /api/shared/<token>/ → sets app.share_token to the URL token,
      which the rls_share_token_read policy checks; '' otherwise
    - Migration / management command → variables are never set, so the bypass policy
      in the migration allows full table access for schema operations.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if connection.vendor == "postgresql":
            user = getattr(request, "user", None)
            user_id = str(user.pk) if (user and user.is_authenticated) else "0"
            match = SHARE_PATH_RE.match(request.path)
            share_token = match.group("token") if match else ""
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT set_config('app.current_user_id', %s, FALSE),"
                    "       set_config('app.share_token', %s, FALSE)",
                    [user_id, share_token],
                )
        return self.get_response(request)
