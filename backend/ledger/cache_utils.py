from django.conf import settings
from django.core.cache import cache

PREFIX = "ledger:v1"
SESSION_ORDERINGS = ("date", "-date", "created_at", "-created_at")


def cache_ttl():
    return getattr(settings, "CACHE_TTL", 300)


# Keys are per-viewer (not per-owner): serializer output is viewer-dependent
# (e.g. the `role` field), so one viewer's payload must never be served to another.
def tables_list_key(viewer_id: str) -> str:
    return f"{PREFIX}:tables:{viewer_id}"


def table_key(viewer_id: str, table_id: int) -> str:
    return f"{PREFIX}:table:{viewer_id}:{table_id}"


def sessions_list_key(viewer_id: str, table_id: int, ordering: str) -> str:
    return f"{PREFIX}:sessions:{viewer_id}:{table_id}:{ordering}"


def session_key(viewer_id: str, session_id: int) -> str:
    return f"{PREFIX}:session:{viewer_id}:{session_id}"


def cache_get(key: str):
    return cache.get(key)


def cache_set(key: str, value, timeout: int | None = None):
    cache.set(key, value, timeout or cache_ttl())


def invalidate_tables_list(viewer_id: str):
    cache.delete(tables_list_key(viewer_id))


def invalidate_table(viewer_ids, table_id: int):
    """Invalidate a table's cached payloads for every viewer (owner + members)."""
    keys = []
    for viewer_id in _as_ids(viewer_ids):
        keys.append(tables_list_key(viewer_id))
        keys.append(table_key(viewer_id, table_id))
        keys.extend(sessions_list_key(viewer_id, table_id, ordering) for ordering in SESSION_ORDERINGS)
    cache.delete_many(keys)


def invalidate_session(viewer_ids, session_id: int, table_id: int):
    keys = []
    for viewer_id in _as_ids(viewer_ids):
        keys.append(session_key(viewer_id, session_id))
        keys.extend(sessions_list_key(viewer_id, table_id, ordering) for ordering in SESSION_ORDERINGS)
    cache.delete_many(keys)


def _as_ids(viewer_ids):
    if isinstance(viewer_ids, (int, str)):
        return [viewer_ids]
    return list(viewer_ids)
