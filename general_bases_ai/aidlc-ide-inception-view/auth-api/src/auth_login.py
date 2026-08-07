"""POST /auth/login — Cognito USER_PASSWORD_AUTH (no JWT on this route)."""

from __future__ import annotations

import os
from typing import Any

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from auth_cognito import (
    build_challenge_body,
    build_tokens_body,
    map_cognito_client_error,
    parse_json_body,
)
from config_session import json_response, plain_text_response

logger = Logger(service=os.environ.get("POWERTOOLS_SERVICE_NAME", "aidlc-auth-api"))

USER_POOL_CLIENT_ID = os.environ.get("USER_POOL_CLIENT_ID", "")

_cognito = boto3.client("cognito-idp")


@logger.inject_lambda_context
def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    body = parse_json_body(event.get("body"))
    if body is None:
        return plain_text_response(400, "Invalid request")

    username = str(body.get("username") or "").strip()
    password = str(body.get("password") or "")
    if not username or not password:
        return plain_text_response(400, "Invalid request")

    if not USER_POOL_CLIENT_ID:
        logger.error("missing_user_pool_client_id")
        return plain_text_response(500, "Authentication failed")

    try:
        response = _cognito.initiate_auth(
            ClientId=USER_POOL_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": username,
                "PASSWORD": password,
            },
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        status, message = map_cognito_client_error(error_code)
        logger.warning("login_failed", extra={"errorCode": error_code, "status": status})
        return plain_text_response(status, message)
    except Exception:
        logger.exception("login_unexpected_error")
        return plain_text_response(500, "Authentication failed")

    challenge = response.get("ChallengeName")
    if challenge == "NEW_PASSWORD_REQUIRED":
        session = response.get("Session") or ""
        logger.info("login_challenge", extra={"challenge": challenge})
        return json_response(
            200,
            build_challenge_body(
                challenge="NEW_PASSWORD_REQUIRED",
                session=session,
                username=username,
            ),
        )

    if challenge:
        logger.warning("unsupported_challenge", extra={"challenge": challenge})
        return plain_text_response(403, "User cannot sign in")

    auth_result = response.get("AuthenticationResult") or {}
    if not auth_result.get("AccessToken"):
        logger.error("login_missing_access_token")
        return plain_text_response(500, "Authentication failed")

    logger.info("login_success")
    return json_response(200, build_tokens_body(auth_result))
