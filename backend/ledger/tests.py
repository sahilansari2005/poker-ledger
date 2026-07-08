from decimal import Decimal
import json

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

from ledger.models import Table, Session, SessionPlayer, SessionSettlement, SessionAuditEntry, LedgerUser, TableTransfer
from ledger.settlement import compute_settlements


def auth_client(username="alice", email=None):
    client = APIClient()
    user = User.objects.create_user(
        username=username,
        email=email or f"{username}@test.com",
        password="test-pass-123",
    )
    client.force_login(user)
    return client, user


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "ledger-tests",
        }
    },
)
class TableAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client, self.user = auth_client("alice")
        self.other_client, _ = auth_client("bob")

    def test_list_tables_requires_auth(self):
        response = APIClient().get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tables_returns_only_owned_tables(self):
        Table.objects.create(name="Alice Table", default_buy_in="10.00", owner=self.user)
        Table.objects.create(name="Bob Table", default_buy_in="10.00", owner=User.objects.get(username="bob"))

        response = self.client.get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["name"], "Alice Table")

    def test_create_table_sets_owner_id(self):
        response = self.client.post(
            "/api/tables/",
            {
                "name": "Friday Night",
                "default_buy_in": "25.00",
                "member_names": ["Alice", "Bob"],
                "currency": "USD",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payload = response.json()
        self.assertEqual(payload["name"], "Friday Night")
        self.assertEqual(payload["owner_id"], self.user.pk)
        self.assertEqual(len(payload["members"]), 2)
        self.assertTrue(Table.objects.filter(name="Friday Night", owner=self.user).exists())

    def test_create_table_invalidates_cached_list(self):
        empty = self.client.get("/api/tables/")
        self.assertEqual(empty.json(), [])

        self.client.post(
            "/api/tables/",
            {"name": "Cached Table", "default_buy_in": "10.00", "member_names": []},
            format="json",
        )

        listed = self.client.get("/api/tables/")
        self.assertEqual(len(listed.json()), 1)
        self.assertEqual(listed.json()[0]["name"], "Cached Table")

    def test_create_table_requires_name(self):
        response = self.client.post(
            "/api/tables/",
            {"default_buy_in": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_access_another_users_table(self):
        bob = User.objects.get(username="bob")
        table = Table.objects.create(name="Private", default_buy_in="10.00", owner=bob)
        response = self.client.get(f"/api/tables/{table.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "ledger-tests",
        }
    },
)
class SessionAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client, self.user = auth_client("alice")
        self.table = Table.objects.create(
            name="Friday Night",
            default_buy_in="15.00",
            currency="AED",
            owner=self.user,
        )

    def test_create_session_applies_table_default_buy_in(self):
        response = self.client.post(
            f"/api/tables/{self.table.id}/sessions/",
            {"player_names": ["Aryan", "DJ"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        session = Session.objects.get(id=response.json()["id"])
        players = SessionPlayer.objects.filter(session=session).order_by("name")
        self.assertEqual(players.count(), 2)
        for player in players:
            self.assertEqual(player.total_buy_in, Decimal("15.00"))

    def test_add_buy_in_increments_player_total(self):
        session = Session.objects.create(table=self.table)
        player = SessionPlayer.objects.create(session=session, name="Aryan", total_buy_in="15.00")

        response = self.client.post(
            f"/api/sessions/{session.id}/buy-in/",
            {"player_id": player.id, "amount": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["total_buy_in"], "25.00")

    def test_update_session_date(self):
        session = Session.objects.create(table=self.table, date="2026-01-10")

        response = self.client.patch(
            f"/api/sessions/{session.id}/",
            {"date": "2026-03-15"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["date"], "2026-03-15")

    def test_list_sessions_sorted_by_date(self):
        older = Session.objects.create(table=self.table, date="2026-01-01")
        newer = Session.objects.create(table=self.table, date="2026-06-01")

        desc = self.client.get(f"/api/tables/{self.table.id}/sessions/?ordering=-date")
        self.assertEqual([s["id"] for s in desc.json()], [newer.id, older.id])

        asc = self.client.get(f"/api/tables/{self.table.id}/sessions/?ordering=date")
        self.assertEqual([s["id"] for s in asc.json()], [older.id, newer.id])

    def test_complete_session_requires_balanced_totals(self):
        session = Session.objects.create(table=self.table)
        p1 = SessionPlayer.objects.create(session=session, name="Aryan", total_buy_in="20.00")
        p2 = SessionPlayer.objects.create(session=session, name="DJ", total_buy_in="20.00")

        response = self.client.post(
            f"/api/sessions/{session.id}/complete/",
            {
                "cash_outs": [
                    {"player_id": p1.id, "cash_out": "30.00"},
                    {"player_id": p2.id, "cash_out": "5.00"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_complete_session_allows_discrepancy_when_confirmed(self):
        session = Session.objects.create(table=self.table)
        p1 = SessionPlayer.objects.create(session=session, name="Aryan", total_buy_in="20.00")
        p2 = SessionPlayer.objects.create(session=session, name="DJ", total_buy_in="20.00")

        response = self.client.post(
            f"/api/sessions/{session.id}/complete/",
            {
                "cash_outs": [
                    {"player_id": p1.id, "cash_out": "30.00"},
                    {"player_id": p2.id, "cash_out": "5.00"},
                ],
                "allow_discrepancy": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_complete_session_creates_settlements_and_audit(self):
        session = Session.objects.create(table=self.table)
        winner = SessionPlayer.objects.create(session=session, name="DJ", total_buy_in="20.00")
        loser = SessionPlayer.objects.create(session=session, name="Fayyad", total_buy_in="20.00")

        response = self.client.post(
            f"/api/sessions/{session.id}/complete/",
            {
                "cash_outs": [
                    {"player_id": winner.id, "cash_out": "35.00"},
                    {"player_id": loser.id, "cash_out": "5.00"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(len(payload["settlements"]), 1)
        self.assertTrue(SessionSettlement.objects.filter(session=session).exists())
        self.assertTrue(SessionAuditEntry.objects.filter(session=session, action="session_completed").exists())

    def test_audit_log_endpoint(self):
        session = Session.objects.create(table=self.table)
        SessionAuditEntry.objects.create(
            session=session,
            actor_id=str(self.user.pk),
            action="session_created",
            message="Session started.",
            details={},
        )

        response = self.client.get(f"/api/sessions/{session.id}/audit-log/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)


class SettlementTests(TestCase):
    def test_compute_settlements_minimizes_transfers(self):
        class Player:
            def __init__(self, name, total_buy_in, cash_out):
                self.name = name
                self.total_buy_in = total_buy_in
                self.cash_out = cash_out

        players = [
            Player("Winner", "20.00", "50.00"),
            Player("LoserA", "30.00", "0.00"),
            Player("LoserB", "20.00", "20.00"),
        ]
        settlements = compute_settlements(players)
        self.assertEqual(len(settlements), 1)
        self.assertEqual(settlements[0]["amount"], Decimal("30.00"))


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "ledger-tests",
        }
    },
)
class MeAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client, self.user = auth_client("alice")
        self.other_client, self.other_user = auth_client("bob")

    def test_get_me_creates_user_profile(self):
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload["user_id"], self.user.pk)
        self.assertTrue(LedgerUser.objects.filter(user=self.user).exists())

    def test_patch_me_updates_preferences(self):
        self.client.get("/api/me/")
        response = self.client.patch(
            "/api/me/",
            {
                "default_currency": "AED",
                "chip_default_values": ["1", "5", "20"],
                "session_sort_order": "asc",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["default_currency"], "AED")

    def test_me_isolated_per_user(self):
        self.client.get("/api/me/")
        self.other_client.get("/api/me/")
        self.other_client.patch("/api/me/", {"default_currency": "USD"}, format="json")

        alice = self.client.get("/api/me/").json()
        bob = self.other_client.get("/api/me/").json()
        self.assertEqual(alice["default_currency"], "GBP")
        self.assertEqual(bob["default_currency"], "USD")


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "ledger-tests",
        }
    },
)
class IngestAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client, self.user = auth_client("alice")

    def test_ingest_creates_table_sessions_and_settlements(self):
        payload = {
            "tables": [
                {
                    "name": "Dubai Summer 2026",
                    "default_buy_in": "20.00",
                    "currency": "AED",
                    "member_names": ["Alice", "Bob"],
                    "sessions": [
                        {
                            "date": "2026-04-05",
                            "players": [
                                {"name": "Alice", "total_buy_in": "20.00", "cash_out": "30.00"},
                                {"name": "Bob", "total_buy_in": "20.00", "cash_out": "10.00"},
                            ],
                        }
                    ],
                }
            ]
        }

        response = self.client.post("/api/me/ingest/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        self.assertEqual(body["tables_created"], 1)
        self.assertEqual(body["sessions_created"], 1)

        table = Table.objects.get(owner=self.user, name="Dubai Summer 2026")
        self.assertEqual(table.currency, "AED")
        self.assertEqual(table.members.count(), 2)

        session = table.sessions.get()
        self.assertTrue(session.is_completed)
        self.assertEqual(session.players.count(), 2)
        self.assertEqual(session.settlements.count(), 1)
        self.assertEqual(session.audit_entries.filter(action="session_imported").count(), 1)

    def test_ingest_allows_discrepant_sessions(self):
        payload = {
            "tables": [
                {
                    "name": "Unbalanced",
                    "default_buy_in": "10.00",
                    "currency": "GBP",
                    "sessions": [
                        {
                            "date": "2026-04-05",
                            "players": [
                                {"name": "Alice", "total_buy_in": "20.00", "cash_out": "30.00"},
                                {"name": "Bob", "total_buy_in": "20.00", "cash_out": "5.00"},
                            ],
                        }
                    ],
                }
            ]
        }

        response = self.client.post("/api/me/ingest/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        session = Session.objects.get(table__name="Unbalanced")
        self.assertEqual(
            session.audit_entries.filter(action="session_imported_with_discrepancy").count(),
            1,
        )

    def test_ingest_normalizes_player_name_aliases(self):
        payload = {
            "tables": [
                {
                    "name": "Alias Test",
                    "default_buy_in": "10.00",
                    "currency": "GBP",
                    "member_names": ["Aly", "Aanya", "Manchit"],
                    "sessions": [
                        {
                            "date": "2026-04-05",
                            "players": [
                                {"name": "Aly", "total_buy_in": "10.00", "cash_out": "15.00"},
                                {"name": "Aaliyah", "total_buy_in": "5.00", "cash_out": "0.00"},
                                {"name": "Aanya C", "total_buy_in": "10.00", "cash_out": "8.00"},
                                {"name": "Manchit", "total_buy_in": "10.00", "cash_out": "7.00"},
                            ],
                        }
                    ],
                }
            ]
        }

        response = self.client.post("/api/me/ingest/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        table = Table.objects.get(name="Alias Test")
        member_names = set(table.members.values_list("name", flat=True))
        self.assertEqual(member_names, {"Aaliyah", "AanyaC", "Manshit"})

        session = table.sessions.get()
        players = {player.name: player for player in session.players.all()}
        self.assertEqual(len(players), 3)
        self.assertEqual(players["Aaliyah"].total_buy_in, Decimal("15.00"))
        self.assertEqual(players["AanyaC"].cash_out, Decimal("8.00"))
        self.assertEqual(players["Manshit"].cash_out, Decimal("7.00"))

    def test_ingest_creates_table_transfers(self):
        payload = {
            "tables": [
                {
                    "name": "Transfer Test",
                    "default_buy_in": "10.00",
                    "currency": "GBP",
                    "transfers": [
                        {"from_player": "Aadi", "to_player": "Daksh", "amount": "50.00"},
                        {"from_player": "Rohan", "to_player": "Aryan", "amount": "30.00"},
                    ],
                    "sessions": [],
                }
            ]
        }

        response = self.client.post("/api/me/ingest/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["transfers_created"], 2)

        table = Table.objects.get(name="Transfer Test")
        transfers = list(table.transfers.order_by("id"))
        self.assertEqual(len(transfers), 2)
        self.assertEqual(transfers[0].from_player, "Aadi")
        self.assertEqual(transfers[1].amount, Decimal("30.00"))

    def test_ingest_requires_auth(self):
        payload = {"tables": [{"name": "X", "default_buy_in": "10", "currency": "GBP", "sessions": []}]}
        response = APIClient().post("/api/me/ingest/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


@override_settings(ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"])
class FrontendAssetTests(TestCase):
    def test_health_endpoint_is_public(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_manifest_is_valid_json_with_manifest_content_type(self):
        response = self.client.get("/manifest.webmanifest")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("application/manifest+json", response["Content-Type"])
        body = b"".join(response.streaming_content)
        payload = json.loads(body.decode())
        self.assertEqual(payload["name"], "Poker Ledger")

    def test_api_tables_requires_auth(self):
        response = self.client.get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
