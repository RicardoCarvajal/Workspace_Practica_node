# Components (Delta) — Menu de modos + Chat RAG

## ModeSelectPage (Renderer)
- Pantalla intermedia tras abrir repo.
- Dos acciones: Observaciones | Chat.
- Navega a `WorkspacePage` con `workspaceMode`.

## WorkspaceShell (Renderer, extend)
- Layout compartido: topbar, volver a lista / menu de modo.
- Modo `observations`: arbol + preview + ObservationsPanel (existente).
- Modo `chat`: arbol/preview opcional + ChatAnalysisPanel.

## ChatAnalysisPanel (Renderer)
- Historial de mensajes de la sesion (por projectId, memoria Main).
- Input de pregunta; muestra citas; boton convertir a observacion.
- Muestra tokens ultimo turno + acumulado sesion.
- Boton/estado de indice (usa pull que reindexa).

## ChatSessionStore (Main)
- Mapa en memoria `projectId → { messages, tokenTotals }`.
- Vive mientras el proceso Electron este abierto; se limpia al salir.

## RagIndexService (Main)
- Chunking de Markdown inception (sin observaciones/).
- Embeddings Titan v2 via Bedrock.
- Persistencia LanceDB en `userData/lancedb/{projectId}/`.
- `reindex(projectId)` / `query(projectId, text, topK)`.

## BedrockChatService (Main)
- Converse Nova Lite con system prompt de analisis+citas.
- Devuelve message, citations[], usage tokens.
- **No** produce FileEdit / no escribe inception.

## ObservationsBridge (Main, extend observations-service)
- `appendObservation` reutilizado al convertir respuesta de chat.
- `pullObservations` dispara `RagIndexService.reindex` al finalizar OK.
