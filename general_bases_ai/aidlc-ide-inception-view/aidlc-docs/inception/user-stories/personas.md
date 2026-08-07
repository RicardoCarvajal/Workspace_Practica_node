# Personas

## P-01 — Colaborador funcional

| Campo | Descripcion |
|---|---|
| **Nombre arquetipo** | Ana — Colaboradora funcional |
| **Rol** | Analista de negocio / producto que participa en la fase Inception de AI-DLC |
| **Identidad auth** | Es el **usuario de Amazon Cognito** (User Pool + MFA); no hay persona admin en la app Electron |
| **Objetivo** | Entrar a la app de forma segura, revisar documentacion de inception en GitLab, registrar observaciones y usar Chat Nova+RAG sin CLI de git |
| **Contexto** | Trabaja en Windows o Linux; no es desarrolladora; usa `git.intelix.biz`; al abrir la app autentica con Cognito **antes** de nombre/apellido |
| **Motivaciones** | Acceso simple y seguro; claridad de requisitos; trazabilidad; no gestionar Access Keys a mano |
| **Frustraciones** | Interfaces tecnicas (ramas, clones, CLI), formularios de credenciales AWS, ver carpetas fuera de inception |
| **Habilidades** | Alta en dominio de negocio; baja en git/AWS avanzado |
| **Dispositivos** | Escritorio Windows / Linux con la app instalada |
| **Citas tipicas** | "Me autentico, pongo mi nombre y ya veo inception en `dev`." |

### Mapeo a features
- Auth Cognito + config Secret en memoria (P0): US-01, US-02, US-13, US-14, US-15
- Listado de repos, viewer inception, preview MD, cambios recientes, observaciones (P0)
- Chat Nova/RAG, publicacion (P1 segun documento base)
- Docs SAM auth API (P1): US-16
- Empaquetado (habilitacion de uso)

### Fuera de alcance de persona en Electron
- Alta/gestion de usuarios Cognito (consola/admin fuera de la app)
- Admin AWS / operador del stack SAM (sin stories de UI en este delta)
