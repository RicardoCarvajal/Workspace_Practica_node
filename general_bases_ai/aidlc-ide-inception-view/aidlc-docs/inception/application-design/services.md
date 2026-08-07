# Services — ATE AI-DLC IDE

Servicios en el **Main process**. El Renderer los invoca via IPC (`aidlc:*`).

## GitLabService
- **Responsibility**: Cliente REST GitLab (Basic auth en sesion)
- **Ops**: autenticar; listar proyectos; obtener arbol/archivo en rama `dev`; historial/diff de archivo; crear rama; commit de archivos; crear Merge Request hacia `dev`
- **Constraints**: solo rama `dev` para lecturas; paths limitados a `aidlc-docs/inception/**` para escritura

## GeminiService
- **Responsibility**: Cliente API Gemini (API key desde entorno / `.env`)
- **Ops**: chat con contexto de archivos de inception; devolver texto y/o ediciones propuestas
- **Constraints**: no exponer API key al Renderer; no loguear secretos

## PublishService
- **Responsibility**: Orquestar publicacion (P1)
- **Flow**: leer drafts → crear rama desde `dev` → commit via GitLabService → crear MR target `dev` → devolver URL
- **Constraints**: requiere confirmacion explicita del usuario (UI)

## DraftFileStore (infra local)
- **Responsibility**: persistencia temporal de borradores en disco del usuario
- **Ops**: write/read/list/clear por `projectId` + path
- **Constraints**: limpiar en logout; no almacenar credenciales; ubicacion bajo userData/temp de la app

## Orchestration pattern
```
Renderer (React)
  --aidlc:* IPC-->  Main handlers
                       |--> AuthSession / domain components
                       |--> GitLabService / GeminiService / PublishService / DraftFileStore
```

Casos de uso no son clases separadas (decision Q5=A): los handlers IPC delegan en services + components.
