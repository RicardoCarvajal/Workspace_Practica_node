/** How Main authenticates subsequent GitLab API calls. */
export type GitLabAuthMode = 'basic' | 'private_token'

export interface Session {
  baseUrl: string
  username: string
  /** Password or Personal Access Token (session memory only). */
  password: string
  authMode: GitLabAuthMode
  isAuthenticated: boolean
}

export interface RememberedLoginHint {
  baseUrl: string
  username: string
}

export interface RepoSummary {
  id: number
  name: string
  pathWithNamespace: string
  description?: string
}

export interface RepoListResult {
  items: RepoSummary[]
  page: number
  pageSize: number
  hasMore: boolean
  searchQuery: string
}

export interface SelectedProjectContext {
  projectId: number
  pathWithNamespace: string
  branch: 'dev'
}

export interface TreeNode {
  name: string
  path: string
  type: 'tree' | 'blob'
  children?: TreeNode[]
}

export interface FileContent {
  path: string
  branch: 'dev'
  content: string
  isMarkdown: boolean
  fromDraft: boolean
  sha?: string
}

export interface RecentDiffView {
  path: string
  commitId: string
  commitTitle: string
  authorName?: string
  committedAt?: string
  unifiedDiff: string
}

export interface AppError {
  title: string
  message: string
  code: string
}

export interface LoginRequest {
  baseUrl: string
  username: string
  password: string
}

export interface ListReposRequest {
  page?: number
  pageSize?: number
  search?: string
}

export interface ListTreeRequest {
  projectId: number
  path?: string
}

export interface GetFileRequest {
  projectId: number
  path: string
}

export interface DraftRequest {
  projectId: number
  path: string
  content?: string
}

export interface RecentDiffRequest {
  projectId: number
  path: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface FileEdit {
  path: string
  content: string
}

export interface ObservationsState {
  /** Filename slug from nombre-apellido (lowercase, hyphenated). */
  authorSlug: string
  displayName: string
  path: string
  content: string
  fromDraft: boolean
}

export interface ObservationsGetRequest {
  projectId: number
}

export interface ObservationsSaveRequest {
  projectId: number
  content: string
}

export interface ObservationsAppendRequest {
  projectId: number
  text: string
  /** Optional inception file the note refers to. */
  relatedPath?: string | null
}

export interface ObservationsCloseRequest {
  projectId: number
}

export interface ObservationsPushResult {
  branch: 'dev'
  commitId: string
  path: string
  authorSlug: string
  displayName: string
  filesCommitted: string[]
  /** New numbered observations file opened after close. */
  nextPath?: string
}

export interface ObservationsPullRequest {
  projectId: number
  forceOwnRefresh?: boolean
}

export interface ObservationsPullResult {
  pulledAt: string
  files: Array<{ path: string; content: string; isOwn: boolean }>
  /** Present when LanceDB reindex ran after pull. */
  indexChunkCount?: number
  indexError?: string
}

/** Result of append: local observation draft + review task pushed to aidlc-state.md */
export interface ObservationsAppendResult extends ObservationsState {
  /** Auto-pull of observations from `dev` before append. */
  pulledFileCount: number
  /** Snapshot of the pull performed before append (own file content updated after save). */
  pull: ObservationsPullResult
  /** Task ordinal under ### INCEPTION PHASE (`Review observations <file>`). */
  reviewTaskNumber: number
  /** Commit id of the aidlc-docs/aidlc-state.md push. */
  stateCommitId: string
}

export interface DraftSummary {
  path: string
  content: string
}

/** @deprecated MR flow removed — kept for type compatibility if needed */
export interface RequestChangesRequest {
  projectId: number
  title?: string
  description?: string
}

export interface RequestChangesResult {
  branch: string
  mergeRequestIid: number
  mergeRequestUrl: string
  filesCommitted: string[]
}

export type AidlcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError }
