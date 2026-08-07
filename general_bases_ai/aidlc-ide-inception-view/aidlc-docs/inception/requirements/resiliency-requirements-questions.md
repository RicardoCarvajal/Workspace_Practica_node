# Preguntas de resiliencia (obligatorias antes de cerrar requisitos)

Activaste la extension de resiliencia. Responde estas preguntas (aplican aunque la app sea de escritorio).

---

## Pregunta R1
Cuales son tus objetivos de RTO/RPO y estrategia de recuperacion ante desastres?

A) RPO/RTO: horas — Backup y Restore. Menor costo. Adecuado para cargas no criticas.

B) RPO/RTO: decenas de minutos — Pilot Light. Costo medio.

C) RPO/RTO: minutos — Warm Standby. Costo alto. Aplicaciones criticas de negocio.

D) RPO/RTO: casi tiempo real — Active/Active multi-sitio. Maximo costo. Mision critica.

E) N/A — Despliegue de escritorio / instaladores; no se requiere DR multi-region. Recuperacion = reinstalar/re-descargar el instalador.

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: E

---

## Pregunta R2
Como deben gobernarse los cambios de produccion (nuevas versiones del instalador)?

A) Usar el proceso formal de change management de la organizacion — indica el nombre/herramienta (ServiceNow, Jira Change, CAB, etc.)

B) No hay proceso formal — AI-DLC propone uno ligero (registro de cambio + aprobacion + nota de rollback)

C) N/A — herramienta interna; exenta de change management formal. Motivo: app de escritorio para colaboradores funcionales.

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: C

---

## Pregunta R3
Que tooling de CI/CD debe usarse para construir e publicar instaladores?

A) Usar el pipeline existente — indica la herramienta (GitLab CI, GitHub Actions, Jenkins, etc.)

B) No hay pipeline — AI-DLC debe proponer uno adecuado (Electron Builder + CI)

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta R4
Como se hace rollback si una version instalada falla?

A) Publicar/reinstalar la version anterior del instalador (rollback por version)

B) Blue/green (no tipico para desktop)

C) Canary (no tipico para desktop)

D) Rollback con impacto en base de datos (no aplica a esta app)

E) Usar el procedimiento de rollback existente de la organizacion — indica la referencia

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta R5
Que estrategia de despliegue/publicacion de versiones es aceptable?

A) Directa / in-place (publicar instalador nuevo; usuarios actualizan) — aceptable para herramientas internas no criticas

B) Rolling (actualizacion gradual de instancias) — tipico cloud

C) Blue/green

D) Canary

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta R6
Como se manejan incidentes de produccion para esta carga?

A) Usar el proceso de incidentes existente — indica la referencia (PagerDuty, on-call interno, etc.)

B) No hay proceso formal — AI-DLC propone uno ligero (reporte + COE/post-mortem)

X) Otro (describelo despues de [Answer]: abajo)

[Answer]: A
