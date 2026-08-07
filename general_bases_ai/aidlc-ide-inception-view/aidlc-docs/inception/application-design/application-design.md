# Application Design (consolidado) — ATE AI-DLC IDE

## Decisiones de diseno

| Tema | Decision |
|---|---|
| Electron | Main + Renderer + preload (contextIsolation) |
| HTTP | GitLab y Gemini solo en Main; UI via IPC |
| Componentes | AuthSession, RepoCatalog, InceptionBrowser, RecentChanges, GeminiChat, PublishPipeline, AppShell + DraftWorkspace |
| Borradores | Archivos temporales en disco (limpiar en logout) |
| Servicios | GitLabService, GeminiService, PublishService (+ DraftFileStore) |
| UI | React + CSS/Tailwind minimo |
| IPC | Prefijo `aidlc:` |
| Rama | Solo `dev` |
| Contenido | Solo `aidlc-docs/inception/` |

## Documentos
- `components.md` — responsabilidades
- `component-methods.md` — firmas
- `services.md` — orquestacion
- `component-dependency.md` — dependencias y flujos

## Seguridad (relevante)
- Password Git solo en memoria de sesion (Main)
- Gemini API key solo via entorno / `.env` (Main)
- Borradores en temp: sin credenciales; clear en logout
- Renderer no hace fetch directo a APIs externas

## Extension compliance (Application Design)
| Extension | Status | Notes |
|---|---|---|
| Security | Compliant (design) | Secretos fuera del Renderer; validacion de paths en stages siguientes |
| Resiliency | N/A / Compliant | Desktop; errores de API superficieados en UI |
| PBT | Deferred | Propiedades en Functional Design / Code Gen |
