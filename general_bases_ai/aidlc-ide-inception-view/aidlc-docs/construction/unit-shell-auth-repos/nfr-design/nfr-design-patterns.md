# NFR Design Patterns — unit-shell-auth-repos

## Resilience
| Pattern | Decision | Detail |
|---|---|---|
| Retry | **None automatic** (Q1=A) | User retries via UI (login submit / load more / search again) |
| Timeout | 30s on GitLab `fetch` | Abort with clear AppError on timeout |
| Fail-fast login | Generic error message | No credential leakage |

## Performance
| Pattern | Decision | Detail |
|---|---|---|
| Cache | **No in-memory list cache** (Q2=A) | Every list/search hits GitLab |
| Loading UX | Explicit loading flags | Keep UI responsive during up-to-5s calls |
| Request cancel | **AbortController** (Q4=A) | Cancel in-flight GET when search changes or view unmounts |

## Security
| Pattern | Decision | Detail |
|---|---|---|
| Secret handling | In-memory SessionStore only (Q3=A) | Clear password on logout; never serialize/log |
| Process isolation | Main-only HTTP + preload bridge | Renderer cannot call GitLab |
| Input allowlist | Validate https baseUrl + non-empty fields | Reject malformed URLs |

## Scalability
| Pattern | Decision | Detail |
|---|---|---|
| Horizontal scale | N/A | Per-desktop process |
| Pagination | Server pages + load more | Bounds UI memory growth |

## Observability
| Pattern | Decision | Detail |
|---|---|---|
| Logging | Console/Main info/warn/error | No passwords; include operation name |

## Patterns explicitly NOT used (this unit)
- Circuit breaker
- Rate limit guard
- TTL cache
- Auto-retry backoff
