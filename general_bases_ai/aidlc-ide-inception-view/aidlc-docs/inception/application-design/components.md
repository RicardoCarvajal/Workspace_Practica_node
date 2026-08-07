# Components — ATE AI-DLC IDE

## Architecture shell
- **Electron Main** + **React Renderer** + **preload** (`contextIsolation: true`)
- HTTP clients (GitLab, Gemini) **solo en Main**
- IPC channels con prefijo `aidlc:`
- UI: React + CSS/Tailwind minimo

## Domain components

### AppShell
- **Purpose**: Ventana principal, layout, navegacion entre pantallas, i18n ES
- **Responsibilities**: Montar vistas (login, repos, workspace); mostrar errores globales; cerrar sesion

### AuthSession
- **Purpose**: Credenciales GitLab en memoria de sesion
- **Responsibilities**: login, logout, estado autenticado; no persistir password en disco

### RepoCatalog
- **Purpose**: Listado y filtro de repositorios accesibles
- **Responsibilities**: obtener repos via GitLabService; buscar por nombre

### InceptionBrowser
- **Purpose**: Navegar y abrir solo `aidlc-docs/inception/` en rama `dev`
- **Responsibilities**: arbol de archivos; cargar contenido; error si falta path o rama `dev`

### RecentChanges
- **Purpose**: Mostrar el cambio mas reciente de un archivo seleccionado
- **Responsibilities**: solicitar diff/historial via GitLabService; presentar diff legible

### GeminiChat
- **Purpose**: Chat con Gemini para editar archivos de inception (P1)
- **Responsibilities**: enviar contexto/mensajes; aplicar ediciones a borradores de sesion

### PublishPipeline
- **Purpose**: Confirmar y publicar cambios a GitLab (P1)
- **Responsibilities**: crear commit en rama de trabajo desde `dev`; crear MR hacia `dev`

### DraftWorkspace (soporte Q4=C)
- **Purpose**: Almacenar borradores de archivos editados en **archivos temporales** del usuario
- **Responsibilities**: leer/escribir temp por path de repo; limpiar al logout/cierre; nunca guardar passwords
