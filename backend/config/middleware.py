from django.db import connection


class SetRLSUserMiddleware:
    """
    Sets the PostgreSQL session variable app.current_user_id on every request.

    This is the companion to the Row Level Security policies in migration 0013.
    The value is scoped to the connection session (is_local=FALSE) so it persists
    across all queries made during the request.

    - Authenticated request  → sets the real user PK (e.g. '42')
    - Unauthenticated request → sets '0', which matches no owner_id (Django PKs start at 1)
    - Migration / management command → variable is never set, so the bypass policy
      in the migration allows full table access for schema operations.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if connection.vendor == "postgresql":
            user = getattr(request, "user", None)
            user_id = str(user.pk) if (user and user.is_authenticated) else "0"
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT set_config('app.current_user_id', %s, FALSE)",
                    [user_id],
                )
        return self.get_response(request)
