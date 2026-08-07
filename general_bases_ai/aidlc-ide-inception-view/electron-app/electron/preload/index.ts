import { contextBridge, ipcRenderer } from 'electron'
import type {
  ChatSendRequest,
  ChatSendResult,
  ChatSessionState,
  RagReindexResult
} from '../../shared/chat-rag'
import { IPC } from '../../shared/ipc-channels'
import type { BootstrapInfo } from '../../shared/runtime-config'
import type {
  AwsLocalCredentials,
  AwsLocalStatus
} from '../../shared/aws-local-credentials'
import type {
  AidlcResult,
  DraftRequest,
  DraftSummary,
  FileContent,
  GetFileRequest,
  ListReposRequest,
  ListTreeRequest,
  LoginRequest,
  ObservationsAppendRequest,
  ObservationsAppendResult,
  ObservationsCloseRequest,
  ObservationsGetRequest,
  ObservationsPullRequest,
  ObservationsPullResult,
  ObservationsPushResult,
  ObservationsSaveRequest,
  ObservationsState,
  RecentDiffRequest,
  RecentDiffView,
  RememberedLoginHint,
  RepoListResult,
  SelectedProjectContext,
  TreeNode
} from '../../shared/types'
import type { UserProfile } from '../../shared/user-profile'

const api = {
  bootstrap: (): Promise<BootstrapInfo> => ipcRenderer.invoke(IPC.bootstrap),
  getRememberedLogin: (): Promise<RememberedLoginHint | null> =>
    ipcRenderer.invoke(IPC.getRememberedLogin),
  getUserProfile: (): Promise<UserProfile | null> => ipcRenderer.invoke(IPC.getUserProfile),
  saveUserProfile: (req: {
    firstName: string
    lastName: string
  }): Promise<AidlcResult<UserProfile>> => ipcRenderer.invoke(IPC.saveUserProfile, req),
  getAwsLocalStatus: (): Promise<AwsLocalStatus> =>
    ipcRenderer.invoke(IPC.getAwsLocalStatus),
  saveAwsLocalCredentials: (
    req: AwsLocalCredentials
  ): Promise<AidlcResult<{ configured: true; region: string }>> =>
    ipcRenderer.invoke(IPC.saveAwsLocalCredentials, req),
  getCognitoAuthStatus: (): Promise<{
    authenticated: boolean
    configLoaded: boolean
    username?: string
    apiConfigured: boolean
  }> => ipcRenderer.invoke(IPC.getCognitoAuthStatus),
  cognitoLogin: (
    req: { username: string; password: string }
  ): Promise<
    | AidlcResult<{ username: string }>
    | {
        ok: true
        challenge: true
        data: { challenge: 'NEW_PASSWORD_REQUIRED'; session: string; username: string }
      }
  > => ipcRenderer.invoke(IPC.cognitoLogin, req),
  cognitoRespondNewPassword: (req: {
    username: string
    session: string
    newPassword: string
  }): Promise<AidlcResult<{ username: string }>> =>
    ipcRenderer.invoke(IPC.cognitoRespondNewPassword, req),
  login: (req: LoginRequest): Promise<AidlcResult<{ username: string }>> =>
    ipcRenderer.invoke(IPC.login, req),
  logout: (): Promise<AidlcResult<null>> => ipcRenderer.invoke(IPC.logout),
  listRepos: (req?: ListReposRequest): Promise<AidlcResult<RepoListResult>> =>
    ipcRenderer.invoke(IPC.listRepos, req ?? {}),
  openRepo: (payload: {
    projectId: number
    pathWithNamespace: string
  }): Promise<AidlcResult<SelectedProjectContext>> =>
    ipcRenderer.invoke(IPC.openRepo, payload),
  listTree: (req: ListTreeRequest): Promise<AidlcResult<TreeNode[]>> =>
    ipcRenderer.invoke(IPC.listTree, req),
  getFile: (req: GetFileRequest): Promise<AidlcResult<FileContent>> =>
    ipcRenderer.invoke(IPC.getFile, req),
  saveDraft: (req: DraftRequest): Promise<AidlcResult<null>> =>
    ipcRenderer.invoke(IPC.saveDraft, req),
  discardDraft: (req: DraftRequest): Promise<AidlcResult<FileContent | null>> =>
    ipcRenderer.invoke(IPC.discardDraft, req),
  clearProjectDrafts: (projectId: number): Promise<AidlcResult<null>> =>
    ipcRenderer.invoke(IPC.clearProjectDrafts, { projectId }),
  listDrafts: (projectId: number): Promise<AidlcResult<DraftSummary[]>> =>
    ipcRenderer.invoke(IPC.listDrafts, { projectId }),
  fileRecentDiff: (req: RecentDiffRequest): Promise<AidlcResult<RecentDiffView>> =>
    ipcRenderer.invoke(IPC.fileRecentDiff, req),
  observationsGet: (req: ObservationsGetRequest): Promise<AidlcResult<ObservationsState>> =>
    ipcRenderer.invoke(IPC.observationsGet, req),
  observationsSave: (req: ObservationsSaveRequest): Promise<AidlcResult<ObservationsState>> =>
    ipcRenderer.invoke(IPC.observationsSave, req),
  observationsAppend: (
    req: ObservationsAppendRequest
  ): Promise<AidlcResult<ObservationsAppendResult>> =>
    ipcRenderer.invoke(IPC.observationsAppend, req),
  observationsClose: (
    req: ObservationsCloseRequest
  ): Promise<AidlcResult<ObservationsPushResult>> =>
    ipcRenderer.invoke(IPC.observationsClose, req),
  observationsPull: (
    req: ObservationsPullRequest
  ): Promise<AidlcResult<ObservationsPullResult>> =>
    ipcRenderer.invoke(IPC.observationsPull, req),
  chatGetSession: (req: {
    projectId: number
  }): Promise<AidlcResult<ChatSessionState>> => ipcRenderer.invoke(IPC.chatGetSession, req),
  chatSend: (req: ChatSendRequest): Promise<AidlcResult<ChatSendResult>> =>
    ipcRenderer.invoke(IPC.chatSend, req),
  ragReindex: (req: {
    projectId: number
  }): Promise<AidlcResult<RagReindexResult>> => ipcRenderer.invoke(IPC.ragReindex, req),
  ragEnsureIndex: (req: {
    projectId: number
  }): Promise<AidlcResult<RagReindexResult>> => ipcRenderer.invoke(IPC.ragEnsureIndex, req)
}

contextBridge.exposeInMainWorld('aidlcApi', api)

export type AidlcApi = typeof api
