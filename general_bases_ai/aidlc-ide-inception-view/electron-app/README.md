# AIDLC IDE — Electron app

Desktop Electron + React + TypeScript: GitLab + `aidlc-docs/` en rama `dev`.

Vive en el monorepo bajo `electron-app/`. La API Cognito/config esta en el hermano `../auth-api/`.

## Setup

```bash
cd electron-app
cp .env.example .env
# Edita AIDLC_CONFIG_API_URL (HttpApiUrl del stack auth-api)
npm install
npm run dev
```

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Desarrollo (lee `.env`) |
| `npm run build` | Build electron-vite |
| `npm run dist` | Empaquetado: solo requiere `AIDLC_CONFIG_API_URL` (se incrusta en Main) |
| `npm test` | Vitest |

### Empaquetado por plataforma (`AIDLC_DIST_TARGETS`)

```bash
# Windows portable (desde Linux o Windows)
AIDLC_DIST_TARGETS=win npm run dist

# Linux tar.gz
AIDLC_DIST_TARGETS=linux npm run dist

# macOS Apple Silicon (arm64) — debe ejecutarse en un Mac
AIDLC_DIST_TARGETS=mac npm run dist
# alias: apple-silicon | mac-arm64

# macOS Intel (x64) — en un Mac
AIDLC_DIST_TARGETS=mac-x64 npm run dist
```

Artefactos en `release/`. mac genera `.dmg` y `.zip` (`…-mac-arm64.dmg`, etc.). Sin firma de Apple (uso interno: clic derecho → Abrir).

## Auth

Login Cognito → `POST /config/session` del `auth-api` → GitLab/AWS/DEV flags solo en memoria (Secret). No van en `.env` ni se bakean en el binario.
