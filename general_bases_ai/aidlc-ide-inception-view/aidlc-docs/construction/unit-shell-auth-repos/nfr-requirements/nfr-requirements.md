# NFR Requirements — unit-shell-auth-repos

## Context
Desktop Electron module: login, repo list/search/pagination, open repo only if branch `dev` exists.

## Scalability
| Item | Requirement |
|---|---|
| Concurrent users | 1–10 (herramienta interna) |
| Scaling model | N/A cloud — cada usuario ejecuta su propia instancia desktop |
| Growth | No auto-scaling; suficiente con GitLab API rate limits normales |

## Performance
| Item | Requirement |
|---|---|
| Login / list latency | Aceptable hasta **5 s** en red corporativa |
| Timeout GitLab HTTP | **30 s** |
| UI feedback | Mostrar loading en login, busqueda y "cargar mas" |

## Availability / Reliability
| Item | Requirement |
|---|---|
| Desktop DR | Reinstalar app (ya decidido a nivel producto) |
| Fault handling | Errores de red/GitLab → AppError; login usa mensaje generico |
| Retry | Reintento manual del usuario (boton / re-submit); sin retry automatico agresivo en login |

## Security
| Item | Requirement |
|---|---|
| Password | Solo memoria Main; no logs; no disco |
| Username/baseUrl | Persistencia ligera RememberedLoginHint |
| Transport | HTTPS a GitLab |
| Renderer | Sin fetch directo; IPC `aidlc:*` |
| Input validation | baseUrl https; username/password no vacios |

## Usability
| Item | Requirement |
|---|---|
| Language | Espanol |
| Screens | Login + Lista |
| Search | Servidor GitLab + paginacion |

## Maintainability / Testing
| Item | Requirement |
|---|---|
| Tests (decision usuario) | Unit tests + mocks GitLab (auth state, RepoSummary mapping, regla `dev`) |
| PBT (extension proyecto) | Propiedades P-AUTH/P-REPO del Functional Design se implementaran en Code Generation (fast-check) ademas de unit tests |
| Logging | Consola/Main basico sin secretos (MVP) |

## Observability
- Logs estructurados simples: timestamp, level, message (sin password)
- Sin servicio centralizado de logs en esta unidad

## Extension compliance (this stage)
| Extension | Status | Notes |
|---|---|---|
| Security | Compliant (reqs) | Session secrets, TLS, no renderer HTTP |
| Resiliency | Compliant / N/A | Desktop; timeout 30s; manual retry |
| PBT | Compliant (planned) | Properties carried to Code Gen despite Q7=A focusing unit tests |
