"""Unit tests for auth_cognito helpers."""

from __future__ import annotations

import json
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

from auth_cognito import (  # noqa: E402
    build_challenge_body,
    build_tokens_body,
    map_cognito_client_error,
    parse_json_body,
)


def test_parse_json_body_valid():
    assert parse_json_body('{"username":"a","password":"b"}') == {
        "username": "a",
        "password": "b",
    }


def test_parse_json_body_invalid():
    assert parse_json_body(None) is None
    assert parse_json_body("") is None
    assert parse_json_body("[]") is None
    assert parse_json_body("not-json") is None


def test_build_tokens_body():
    body = json.loads(
        build_tokens_body(
            {
                "AccessToken": "at",
                "IdToken": "id",
                "RefreshToken": "rt",
                "ExpiresIn": 3600,
                "TokenType": "Bearer",
            }
        )
    )
    assert body["accessToken"] == "at"
    assert body["expiresIn"] == 3600


def test_build_challenge_body():
    body = json.loads(
        build_challenge_body(
            challenge="NEW_PASSWORD_REQUIRED",
            session="sess",
            username="alice",
        )
    )
    assert body["challenge"] == "NEW_PASSWORD_REQUIRED"
    assert body["session"] == "sess"
    assert body["username"] == "alice"


def test_map_cognito_errors():
    assert map_cognito_client_error("InvalidPasswordException") == (
        400,
        "Password does not meet policy",
    )
    assert map_cognito_client_error("NotAuthorizedException") == (401, "Invalid credentials")
    assert map_cognito_client_error("UserNotFoundException") == (401, "Invalid credentials")
    assert map_cognito_client_error("TooManyRequestsException")[0] == 429
    assert map_cognito_client_error("SomethingElse")[0] == 500
