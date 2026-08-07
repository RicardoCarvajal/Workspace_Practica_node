# Units of Work — ATE AI-DLC IDE

**Deployment model**: Single desktop application (Electron monolith with logical modules).  
**Build order**: sequential 1 → 2 → 3 → 4  
**Shared code**: `shared/` (types, errors, IPC channel constants)

## Code organization (greenfield)

```
/
  package.json
  electron/                 # Main process + preload
    main/
    preload/
    services/               # GitLabService, GeminiService, PublishService, DraftFileStore
    ipc/                    # aidlc:* handlers
  src/                      # React renderer
    views/
    components/
    hooks/
  shared/                   # Shared types, AppError, IPC channel names
  build/                    # electron-builder config
  .env.example              # GEMINI_API_KEY placeholder (no secrets committed)
```

Logical modules map to units below; physical layout stays one Electron app.

---

## Unit 1: unit-shell-auth-repos

| Field | Value |
|---|---|
| **Type** | Module (logical) within desktop app |
| **Priority** | P0 — first |
| **Responsibility** | App shell Electron, login/logout sesion, listado/filtro de repos, enforcement rama `dev` |
| **Components** | AppShell, AuthSession, RepoCatalog |
| **Services** | GitLabService (auth + list projects + verify branch `dev`) |
| **Stories** | US-01, US-02, US-03, US-04 |
| **Out of scope** | File tree, Markdown, Gemini, MR, installers |

## Unit 2: unit-inception-viewer

| Field | Value |
|---|---|
| **Type** | Module |
| **Priority** | P0 — second |
| **Responsibility** | Arbol `aidlc-docs/inception/`, abrir archivos, preview Markdown, cambios recientes |
| **Components** | InceptionBrowser, RecentChanges |
| **Services** | GitLabService (tree, file, commit/diff on `dev`) |
| **Stories** | US-05, US-06, US-07, US-08 |
| **Depends on** | unit-shell-auth-repos (sesion + project seleccionado) |
| **Out of scope** | Gemini, publish, packaging |

## Unit 3: unit-gemini-publish

| Field | Value |
|---|---|
| **Type** | Module |
| **Priority** | P1 — third |
| **Responsibility** | Chat Gemini, borradores en temp, confirmacion commit/MR hacia `dev` |
| **Components** | GeminiChat, PublishPipeline, DraftWorkspace |
| **Services** | GeminiService, PublishService, DraftFileStore (+ GitLabService write ops) |
| **Stories** | US-09, US-10, US-11 |
| **Depends on** | unit-shell-auth-repos, unit-inception-viewer (contexto de archivo/repo) |
| **Out of scope** | Installers |

## Unit 4: unit-packaging

| Field | Value |
|---|---|
| **Type** | Module / build pipeline |
| **Priority** | P0 habilitacion / last in sequence |
| **Responsibility** | electron-builder: Windows portable + Linux AppImage (sin instaladores); prompts de credenciales en build |
| **Components** | N/A runtime (build config) |
| **Stories** | US-12 |
| **Depends on** | Units 1–3 code present enough to package (can finalize after P0 or after P1) |

## Success criteria per unit
- Unit 1: login + list repos + open only if `dev` exists
- Unit 2: browse inception + MD preview + recent diff
- Unit 3: chat edits drafts + confirmed MR to `dev`
- Unit 4: produces Win portable .exe + Linux AppImage (no installers)
