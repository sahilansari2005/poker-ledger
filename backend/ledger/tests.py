from decimal import Decimal
import json

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from ledger.models import Table, Session, SessionPlayer


def auth_client(user_id="user_test"):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_id}")
    return client


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CLERK_ISSUER="",
)
class TableAPITests(TestCase):
    def setUp(self):
        self.client = auth_client("user_alice")
        self.other_client = auth_client("user_bob")

    def test_list_tables_requires_auth(self):
        response = APIClient().get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tables_returns_only_owned_tables(self):
        Table.objects.create(name="Alice Table", default_buy_in="10.00", owner_id="user_alice")
        Table.objects.create(name="Bob Table", default_buy_in="10.00", owner_id="user_bob")

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
        self.assertEqual(payload["owner_id"], "user_alice")
        self.assertEqual(Decimal(payload["default_buy_in"]), Decimal("25.00"))
        self.assertEqual(len(payload["members"]), 2)
        self.assertTrue(Table.objects.filter(name="Friday Night", owner_id="user_alice").exists())

    def test_create_table_requires_name(self):
        response = self.client.post(
            "/api/tables/",
            {"default_buy_in": "10.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_access_another_users_table(self):
        table = Table.objects.create(name="Private", default_buy_in="10.00", owner_id="user_bob")
        response = self.client.get(f"/api/tables/{table.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(
    ALLOWED_HOSTS=["testserver", "127.0.0.1", "localhost"],
    DEBUG=True,
    CLERK_ISSUER="",
)
class SessionAPITests(TestCase):
    def setUp(self):
        self.client = auth_client("user_alice")
        self.table = Table.objects.create(
            name="Friday Night",
            default_buy_in="15.00",
            currency="AED",
            owner_id="user_alice",
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

        payload = response.json()
        self.assertEqual(payload["players"][0]["total_buy_in"], "15.00")
        self.assertEqual(payload["players"][1]["total_buy_in"], "15.00")

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
        self.assertTrue(payload["icons"])

    def test_spa_route_does_not_shadow_manifest(self):
        response = self.client.get("/manifest.webmanifest")
        body = b"".join(response.streaming_content)
        self.assertNotIn(b"<!doctype html", body.lower())

    def test_api_tables_requires_auth(self):
        response = self.client.get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
