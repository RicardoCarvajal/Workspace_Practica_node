# Tech Stack Decisions — unit-shell-auth-repos

| Area | Choice | Rationale |
|---|---|---|
| Desktop runtime | Electron (current LTS-compatible) | Requisito de producto |
| UI | React + TypeScript + CSS/Tailwind minimo | Q3=A; tipado; UI simple |
| Main process | Node (Electron) + TypeScript | Mismos tipos que shared |
| HTTP client | `fetch` nativo en Main | Q4=A; sin dependencia extra |
| Auth to GitLab | HTTP Basic (username/password) en headers | Requisitos FR-01 |
| IPC | `contextBridge` + `aidlc:*` channels | Application Design |
| State (renderer) | React state / hooks locales | Unidad pequena; sin Redux obligatorio |
| Persist hint | electron `userData` JSON o equivalente simple | Solo username + baseUrl |
| Logging | `console` / logger fino en Main | Q5=A MVP |
| Unit test runner | Vitest (o Jest) | Rapido con TS |
| Mocking | Mock fetch / GitLab responses | Q7=A |
| PBT lib | `fast-check` (Code Gen) | Extension PBT del proyecto |
| Packaging | Diferido a unit-packaging | No en esta unidad |

## Versions (to pin at Code Generation)
- Node/Electron: pin exact versions in package.json
- React 18+
- TypeScript 5+
- No open version ranges (`^` avoid where possible per team standards when applicable)

## Out of scope for this unit
- Gemini client
- Draft temp files
- electron-builder installers
