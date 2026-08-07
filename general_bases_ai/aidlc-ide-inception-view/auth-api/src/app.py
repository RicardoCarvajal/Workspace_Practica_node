"""Config session Lambda — returns Secrets Manager JSON for Cognito JWT callers."""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities import parameters
from botocore.exceptions import ClientError

from config_session import (
    build_audit_item,
    build_success_body,
    extract_principal,
    json_response,
    parse_secret_string,
    plain_text_response,
)

logger = Logger(service=os.environ.get("POWERTOOLS_SERVICE_NAME", "aidlc-auth-api"))

AUDIT_TABLE_NAME = os.environ.get("AUDIT_TABLE_NAME", "")
APP_CONFIG_SECRET_NAME = os.environ.get(
    "APP_CONFIG_SECRET_NAME", "/dev/aidlc/auth-api/app-config"
)
SECRET_CACHE_MAX_AGE = int(os.environ.get("SECRET_CACHE_MAX_AGE", "300"))
AUDIT_TTL_SECONDS = 90 * 24 * 60 * 60

_dynamodb = boto3.resource("dynamodb")


def get_request_id(event: dict[str, Any], context: Any) -> str | None:
    req = event.get("requestContext", {}).get("requestId")
    if req:
        return str(req)
    if context is not None and getattr(context, "aws_request_id", None):
        return str(context.aws_request_id)
    return None


def fetch_secret_string(secret_name: str, max_age: int) -> str:
    """Fetch secret with Powertools cache; one retry on failure."""
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            value = parameters.get_secret(secret_name, max_age=max_age)
            if isinstance(value, dict):
                return json.dumps(value)
            return str(value)
        except Exception as exc:  # noqa: BLE001 — single retry then re-raise
            last_error = exc
            logger.warning("secrets_manager_fetch_failed", extra={"attempt": attempt + 1})
            if attempt == 0:
                continue
            raise last_error
    raise RuntimeError("unreachable")


def write_audit_record(
    *,
    table_name: str,
    principal_sub: str | None,
    principal_username: str | None,
    outcome: str,
    api_request_id: str | None,
) -> None:
    if not table_name:
        logger.warning("audit_skipped_missing_table")
        return
    table = _dynamodb.Table(table_name)
    now = int(time.time())
    item = build_audit_item(
        audit_id=str(uuid.uuid4()),
        principal_sub=principal_sub,
        principal_username=principal_username,
        outcome=outcome,
        api_request_id=api_request_id,
        recorded_at=now,
        ttl_seconds=AUDIT_TTL_SECONDS,
    )
    table.put_item(Item=item)


@logger.inject_lambda_context
def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    principal_sub, principal_username = extract_principal(event)
    request_id = get_request_id(event, context)

    try:
        secret_string = fetch_secret_string(APP_CONFIG_SECRET_NAME, SECRET_CACHE_MAX_AGE)
        config = parse_secret_string(secret_string)
        if config is None:
            try:
                write_audit_record(
                    table_name=AUDIT_TABLE_NAME,
                    principal_sub=principal_sub,
                    principal_username=principal_username,
                    outcome="config_not_found",
                    api_request_id=request_id,
                )
            except ClientError:
                logger.warning("audit_write_failed", extra={"outcome": "config_not_found"})
            return plain_text_response(404, "Config not found")

        try:
            write_audit_record(
                table_name=AUDIT_TABLE_NAME,
                principal_sub=principal_sub,
                principal_username=principal_username,
                outcome="success",
                api_request_id=request_id,
            )
        except ClientError:
            logger.warning("audit_write_failed", extra={"outcome": "success"})

        return json_response(200, build_success_body(config))

    except Exception:
        logger.exception("config_session_failed")
        try:
            write_audit_record(
                table_name=AUDIT_TABLE_NAME,
                principal_sub=principal_sub,
                principal_username=principal_username,
                outcome="error",
                api_request_id=request_id,
            )
        except ClientError:
            logger.warning("audit_write_failed", extra={"outcome": "error"})
        return plain_text_response(500, "Internal server error")
