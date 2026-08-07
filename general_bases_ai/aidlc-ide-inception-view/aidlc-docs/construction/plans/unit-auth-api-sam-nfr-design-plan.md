# NFR Design Plan — unit-auth-api-sam

**Prior**: NFR Requirements approved  
**Next**: Infrastructure Design

## Part 2 checklist

- [x] `nfr-design-patterns.md`
- [x] `logical-components.md`
- [x] Present NFR Design Complete

---

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | A | Audit fail → still 200 + warn |
| 2 | A | 1 retry on Secrets Manager then 5xx |
| 3 | X | Cache via **AWS Lambda Powertools** (max_age ~5 min) |
| 4 | A | Cognito public app client |
| 5 | A | Minimal handler + helpers |
| 6 | A | No CloudWatch alarms in MVP |

---

## Questions — fill every `[Answer]:`

---

## Question 1
Si falla la **escritura de auditoria** DynamoDB pero el Secret se leyo bien

A) Igual devolver **200** con config; loguear warn de audit (no bloquear login)

B) Devolver **5xx** (audit obligatorio para considerar exito)

C) 200 + header/flag `auditFailed=true` (Electron ignora el flag en MVP)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Patron ante fallo de Secrets Manager (throttling / 5xx AWS)

A) Un reintento interno corto (1 retry) luego 5xx plain text

B) Sin retry en Lambda; Electron reintenta si quiere

C) Circuit breaker / fallback cache stale even past TTL

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
Invalidacion del cache del Secret (TTL 5 min)

A) Solo por TTL / cold start (MVP)

B) Ademas endpoint admin o env `FORCE_REFRESH` (fuera de MVP → X si quieres)

C) Cache deshabilitado si `AIDLC_DEV_MODE` en el propio Secret es true

X) Other (describe after [Answer]: below)

[Answer]: X Usar la libreria lambda power tool

---

## Question 4
Patron de seguridad para el App Client Cognito (desktop)

A) App client **public** (no secret) + auth flows password + MFA; PKCE N/A para user/pass directo

B) App client con client secret embebido en Electron (no recomendado)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Estructura logica del handler Lambda

A) Un solo archivo `handler` + helpers (cache, audit, parse) — minimal (alineado Q8 design)

B) Carpetas `application/` + `infrastructure/` ligeras (hexagonal light)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Alarmas CloudWatch (MVP)

A) Ninguna alarma en MVP; solo metrics default

B) Alarma basica: errores Lambda &gt; umbral / 5 min

C) Alarma errores + latencia p95

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Instructions

1. Rellena cada `[Answer]:`.
2. Escribe **listo** en el chat.
