"""Pure helpers for config session (unit-testable without AWS)."""

from __future__ import annotations

import json
from typing import Any


def parse_secret_string(secret_string: str | None) -> dict[str, Any] | None:
    """Return a dict if secret_string is a non-empty JSON object; else None."""
    if secret_string is None:
        return None
    text = secret_string.strip()
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    return data


def build_success_body(config: dict[str, Any]) -> str:
    return json.dumps({"config": config})


def plain_text_response(status_code: int, message: str) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "text/plain; charset=utf-8"},
        "body": message,
    }


def json_response(status_code: int, body: str) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": body,
    }


def extract_principal(event: dict[str, Any]) -> tuple[str | None, str | None]:
    """Best-effort sub / username from HTTP API JWT authorizer claims."""
    claims = (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )
    if not isinstance(claims, dict):
        return None, None
    sub = claims.get("sub")
    username = claims.get("username") or claims.get("cognito:username")
    return (str(sub) if sub else None, str(username) if username else None)


def build_audit_item(
    *,
    audit_id: str,
    principal_sub: str | None,
    principal_username: str | None,
    outcome: str,
    api_request_id: str | None,
    recorded_at: int,
    ttl_seconds: int,
) -> dict[str, Any]:
    return {
        "auditId": audit_id,
        "principalSub": principal_sub or "unknown",
        "principalUsername": principal_username or "",
        "recordedAt": recorded_at,
        "outcome": outcome,
        "apiRequestId": api_request_id or "",
        "expires_at": recorded_at + ttl_seconds,
    }
