PLAYER_NAME_ALIASES = {
    "aly": "Aaliyah",
    "aanya": "AanyaC",
    "aanya c": "AanyaC",
    "aanyac": "AanyaC",
    "manchit": "Manshit",
}


def canonical_player_name(name):
    normalized = (name or "").strip()
    if not normalized:
        return normalized
    return PLAYER_NAME_ALIASES.get(normalized.lower(), normalized)
