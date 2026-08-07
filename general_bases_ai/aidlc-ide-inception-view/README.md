# AIDLC IDE — monorepo

Dos aplicaciones en directorios hermanos:

| Directorio | Aplicacion |
|---|---|
| `electron-app/` | Desktop Electron + React (inception view, GitLab, Chat) |
| `auth-api/` | AWS SAM — Cognito + HTTP API `POST /config/session` + Secret |

Documentacion AIDLC del workflow: `aidlc-docs/` (raiz del monorepo).

---

## Electron (`electron-app/`)

```bash
cd electron-app
cp .env.example .env   # si aplica
npm install
npm run dev
```

Empaquetado: `npm run dist` desde `electron-app/`.

---

## Auth API (`auth-api/`)

```bash
cd auth-api
sam build
sam deploy --config-env devate
```

Ver `auth-api/documentation/Wiki.md` y `context.md`.

---

## Estructura

```text
aidlc-ide-inception-view/
  electron-app/     # app de escritorio
  auth-api/         # stack SAM de autenticacion / config
  aidlc-docs/       # inception + construction docs
  .cursor/          # reglas Cursor
```
