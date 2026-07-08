from django.conf import settings
from django.core.cache import cache

PREFIX = "ledger:v1"
SESSION_ORDERINGS = ("date", "-date", "created_at", "-created_at")


def cache_ttl():
    return getattr(settings, "CACHE_TTL", 300)


def tables_list_key(owner_id: str) -> str:
    return f"{PREFIX}:tables:{owner_id}"


def table_key(owner_id: str, table_id: int) -> str:
    return f"{PREFIX}:table:{owner_id}:{table_id}"


def sessions_list_key(owner_id: str, table_id: int, ordering: str) -> str:
    return f"{PREFIX}:sessions:{owner_id}:{table_id}:{ordering}"


def session_key(owner_id: str, session_id: int) -> str:
    return f"{PREFIX}:session:{owner_id}:{session_id}"


def cache_get(key: str):
    return cache.get(key)


def cache_set(key: str, value, timeout: int | None = None):
    cache.set(key, value, timeout or cache_ttl())


def invalidate_tables_list(owner_id: str):
    cache.delete(tables_list_key(owner_id))


def invalidate_table(owner_id: str, table_id: int):
    keys = [
        tables_list_key(owner_id),
        table_key(owner_id, table_id),
        *[sessions_list_key(owner_id, table_id, ordering) for ordering in SESSION_ORDERINGS],
    ]
    cache.delete_many(keys)


def invalidate_session(owner_id: str, session_id: int, table_id: int):
    keys = [
        session_key(owner_id, session_id),
        *[sessions_list_key(owner_id, table_id, ordering) for ordering in SESSION_ORDERINGS],
    ]
    cache.delete_many(keys)
