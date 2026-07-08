from .models import SessionAuditEntry


def log_session_audit(session, *, actor_id, action, message, details=None):
    SessionAuditEntry.objects.create(
        session=session,
        actor_id=actor_id or "",
        action=action,
        message=message,
        details=details or {},
    )
