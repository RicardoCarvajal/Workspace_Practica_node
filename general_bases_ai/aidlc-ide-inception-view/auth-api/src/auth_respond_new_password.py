"""POST /auth/respond-new-password — Cognito NEW_PASSWORD_REQUIRED challenge."""

from __future__ import annotations

import os
from typing import Any

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from auth_cognito import (
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
    session = str(body.get("session") or "")
    new_password = str(body.get("newPassword") or "")
    if not username or not session or not new_password:
        return plain_text_response(400, "Invalid request")

    if not USER_POOL_CLIENT_ID:
        logger.error("missing_user_pool_client_id")
        return plain_text_response(500, "Authentication failed")

    try:
        response = _cognito.respond_to_auth_challenge(
            ClientId=USER_POOL_CLIENT_ID,
            ChallengeName="NEW_PASSWORD_REQUIRED",
            Session=session,
            ChallengeResponses={
                "USERNAME": username,
                "NEW_PASSWORD": new_password,
            },
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        status, message = map_cognito_client_error(error_code)
        logger.warning(
            "respond_new_password_failed",
            extra={"errorCode": error_code, "status": status},
        )
        return plain_text_response(status, message)
    except Exception:
        logger.exception("respond_new_password_unexpected_error")
        return plain_text_response(500, "Authentication failed")

    auth_result = response.get("AuthenticationResult") or {}
    if not auth_result.get("AccessToken"):
        # Nested challenge unlikely for MVP
        if response.get("ChallengeName"):
            logger.warning(
                "unexpected_followup_challenge",
                extra={"challenge": response.get("ChallengeName")},
            )
            return plain_text_response(403, "User cannot sign in")
        logger.error("respond_missing_access_token")
        return plain_text_response(500, "Authentication failed")

    logger.info("respond_new_password_success")
    return json_response(200, build_tokens_body(auth_result))
