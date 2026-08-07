# Component Dependencies — ATE AI-DLC IDE

## Dependency matrix

| From \ To | AppShell | AuthSession | RepoCatalog | InceptionBrowser | RecentChanges | GeminiChat | PublishPipeline | DraftWorkspace | GitLabService | GeminiService | PublishService |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AppShell | - | uses | uses | uses | uses | uses | uses | - | - | - | - |
| AuthSession | - | - | - | - | - | - | - | clears | uses | - | - |
| RepoCatalog | - | needs auth | - | - | - | - | - | - | uses | - | - |
| InceptionBrowser | - | needs auth | - | - | - | - | - | uses | uses | - | - |
| RecentChanges | - | needs auth | - | - | - | - | - | - | uses | - | - |
| GeminiChat | - | needs auth | - | - | - | - | - | uses | - | uses | - |
| PublishPipeline | - | needs auth | - | - | - | - | - | uses | - | - | uses |
| PublishService | - | - | - | - | - | - | - | uses | uses | - | - |

## Communication patterns
- **UI → Main**: IPC `aidlc:*` (preload bridge)
- **Main → GitLab/Gemini**: HTTPS REST
- **Drafts**: Main ↔ filesystem temp (DraftFileStore)

## Data flow (P0 read)
```
Login --> AuthSession --> GitLabService
List Repositories --> RepoCatalog --> GitLabService
Open repo --> InceptionBrowser --> GitLabService (branch=dev, path=aidlc-docs/inception)
Open file --> InceptionBrowser (+ DraftWorkspace overlay)
Recent changes --> RecentChanges --> GitLabService
```

## Data flow (P1 write)
```
Chat --> GeminiChat --> GeminiService --> DraftWorkspace
Publish --> PublishPipeline --> PublishService --> DraftWorkspace + GitLabService --> MR(dev)
```

## Text alternative — layers
1. Renderer UI (AppShell + views)
2. Preload IPC bridge
3. Main domain components
4. Services (GitLab, Gemini, Publish, Draft)
5. External: GitLab API, Gemini API, local temp files
