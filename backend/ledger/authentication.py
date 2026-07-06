import jwt
from django.conf import settings
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ClerkUser:
    """Lightweight user object backed by a Clerk user id (JWT sub claim)."""

    def __init__(self, clerk_id: str):
        self.id = clerk_id
        self.clerk_id = clerk_id
        self.is_authenticated = True

    def __str__(self):
        return self.clerk_id


_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{settings.CLERK_ISSUER}/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def verify_clerk_token(token: str) -> str:
    if not settings.CLERK_ISSUER:
        raise AuthenticationFailed("Clerk is not configured.")

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"require": ["sub", "iss", "exp"]},
        )
    except jwt.PyJWTError as exc:
        raise AuthenticationFailed("Invalid or expired token.") from exc

    clerk_id = payload.get("sub")
    if not clerk_id:
        raise AuthenticationFailed("Token is missing a user id.")

    return clerk_id


class ClerkAuthentication(BaseAuthentication):
    """Validate Clerk session JWTs from the Authorization header."""

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:].strip()
        if not token:
            return None

        clerk_id = verify_clerk_token(token)
        return ClerkUser(clerk_id), token


class DevBearerAuthentication(BaseAuthentication):
    """Local dev fallback: treat the bearer token value as the user id."""

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        user_id = auth_header[7:].strip()
        if not user_id:
            return None

        return ClerkUser(user_id), user_id
