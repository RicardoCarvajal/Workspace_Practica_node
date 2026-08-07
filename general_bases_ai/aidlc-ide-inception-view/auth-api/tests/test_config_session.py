"""Unit tests for config_session helpers."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))

from config_session import (  # noqa: E402
    build_audit_item,
    build_success_body,
    extract_principal,
    parse_secret_string,
    plain_text_response,
)


def test_parse_secret_valid_object():
    raw = '{"AWS_REGION":"us-east-1","AIDLC_DEV_MODE":"false"}'
    data = parse_secret_string(raw)
    assert data is not None
    assert data["AWS_REGION"] == "us-east-1"


def test_parse_secret_empty_or_invalid():
    assert parse_secret_string(None) is None
    assert parse_secret_string("") is None
    assert parse_secret_string("   ") is None
    assert parse_secret_string("not-json") is None
    assert parse_secret_string("[]") is None
    assert parse_secret_string('"string"') is None


def test_success_envelope():
    body = build_success_body({"A": "1"})
    assert json.loads(body) == {"config": {"A": "1"}}


def test_plain_text_404():
    resp = plain_text_response(404, "Config not found")
    assert resp["statusCode"] == 404
    assert resp["body"] == "Config not found"
    assert "text/plain" in resp["headers"]["Content-Type"]


def test_extract_principal():
    event = {
        "requestContext": {
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "abc-123",
                        "username": "ana",
                    }
                }
            }
        }
    }
    sub, username = extract_principal(event)
    assert sub == "abc-123"
    assert username == "ana"


def test_audit_item_shape():
    item = build_audit_item(
        audit_id="id-1",
        principal_sub="sub",
        principal_username="user",
        outcome="success",
        api_request_id="req",
        recorded_at=1_700_000_000,
        ttl_seconds=100,
    )
    assert item["auditId"] == "id-1"
    assert item["outcome"] == "success"
    assert item["expires_at"] == 1_700_000_100
    assert "config" not in item
