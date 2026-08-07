# Test Summary — unit-auth-api-sam

- Suite: `auth-api/tests/test_config_session.py`
- Covers: parse secret, envelope, 404 body, principal extract, audit item shape (no secret payload)
- Run: `cd auth-api && python3 -m pytest tests/ -q`
