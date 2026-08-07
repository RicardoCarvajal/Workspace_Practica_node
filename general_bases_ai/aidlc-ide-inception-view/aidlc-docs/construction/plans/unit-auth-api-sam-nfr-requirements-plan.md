# NFR Requirements Plan — unit-auth-api-sam

**Unit**: `unit-auth-api-sam`  
**Prior FD**: config session + Cognito TOTP + DynamoDB audit  
**Next after this stage**: NFR Design

## Part 2 checklist

- [x] `nfr-requirements.md`
- [x] `tech-stack-decisions.md`
- [x] Present NFR Requirements Complete

---

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | A | Low load &lt; 50 calls/hour |
| 2 | B | p95 &lt; 5 s |
| 3 | A | Python 3.13 |
| 4 | A | Log retention 7 days (dev) |
| 5 | A | Audit TTL 90 days |
| 6 | X | Secret cache TTL **~5 min** |
| 7 | A | Internal medium/low criticality |
| 8 | A | Unit tests + Postman checklist |

---

## Questions — fill every `[Answer]:`

---

## Question 1
Carga esperada del API (usuarios internos desktop)

A) Baja: &lt; 50 llamadas/hora; diseno serverless on-demand basta

B) Media: hasta ~100 usuarios concurrentes en pico de manana

C) Alta: especificar numeros en X

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Latencia objetivo de `POST /config/session` (p95)

A) &lt; 2 s (incluye Secrets Manager + DynamoDB audit)

B) &lt; 5 s aceptable en red corporativa

C) Sin SLA numerico; “lo bastante rapido para login”

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 3
Runtime Lambda

A) **Python 3.13** (estandar equipo)

B) Node.js 22.x

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4
Retencion de logs CloudWatch (dev)

A) **7 dias** (estandar DEV/QA del equipo)

B) 30 dias

C) 1 dia

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Retencion / TTL de **auditoria DynamoDB**

A) TTL **90 dias** luego borrado automatico

B) TTL **30 dias**

C) Sin TTL; retener indefinido (PAY_PER_REQUEST)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Cache del Secret en Lambda (warm start)

A) Si — cache en memoria con TTL ~15 min (menos llamadas a Secrets Manager)

B) No — leer Secret en cada request (siempre fresco)

C) Cache sin TTL hasta cold start

X) Other (describe after [Answer]: below)

[Answer]: X cache en memoria con TTL ~5 min (menos llamadas a Secrets Manager)

---

## Question 7
Disponibilidad / criticidad

A) Herramienta interna medium/low — sin multi-region ni DR elaborado

B) Alta — exigir multi-AZ explicito y runbook de fallo

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 8
Pruebas prioritarias para este unit

A) Unit tests Lambda (parse Secret, 404 path, audit shape) + checklist manual Postman

B) Unit + contract tests del HTTP API

C) Solo checklist manual / Postman en MVP

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Instructions

1. Rellena cada `[Answer]:`.
2. Escribe **listo** en el chat.
