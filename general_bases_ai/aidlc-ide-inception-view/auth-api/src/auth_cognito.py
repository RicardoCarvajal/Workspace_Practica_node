"""Pure helpers for Cognito auth login / new-password challenge."""

from __future__ import annotations

import json
from typing import Any


def parse_json_body(raw: str | None) -> dict[str, Any] | None:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    return data


def build_tokens_body(auth_result: dict[str, Any]) -> str:
    return json.dumps(
        {
            "accessToken": auth_result.get("AccessToken", ""),
            "idToken": auth_result.get("IdToken", ""),
            "refreshToken": auth_result.get("RefreshToken", ""),
            "expiresIn": auth_result.get("ExpiresIn"),
            "tokenType": auth_result.get("TokenType", "Bearer"),
        }
    )


def build_challenge_body(*, challenge: str, session: str, username: str) -> str:
    return json.dumps(
        {
            "challenge": challenge,
            "session": session,
            "username": username,
        }
    )


def map_cognito_client_error(error_code: str | None) -> tuple[int, str]:
    """Map Cognito error codes to HTTP status + plain-text message (no secrets)."""
    code = (error_code or "").strip()
    if code == "InvalidPasswordException":
        return 400, "Password does not meet policy"
    if code in {
        "NotAuthorizedException",
        "UserNotFoundException",
    }:
        return 401, "Invalid credentials"
    if code in {"UserNotConfirmedException", "PasswordResetRequiredException"}:
        return 403, "User cannot sign in"
    if code in {"InvalidParameterException", "InvalidLambdaResponseException"}:
        return 400, "Invalid request"
    if code == "TooManyRequestsException":
        return 429, "Too many requests"
    return 500, "Authentication failed"
