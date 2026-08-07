import { ipcMain } from 'electron'
import { VALIDATION_ERROR } from '../../shared/errors'
import { IPC } from '../../shared/ipc-channels'
import { isObservationsFilePath } from '../../shared/observations'
import { asAppError, DOCS_ROOT } from '../../shared/path-guard'
import type { BootstrapInfo } from '../../shared/runtime-config'
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
import { displayName } from '../../shared/user-profile'
import { clearAwsBedrockConfigCache } from '../config/aws-config'
import { isAwsPromptMode } from '../config/aws-mode'
import {
  findEnvFilePath,
  getAppSecrets,
  getDevFlags,
  getResolvedAwsRegion,
  missingConfigKeys
} from '../config/load-config'
import {
  cognitoLogin,
  cognitoLogout,
  cognitoRespondNewPassword,
  getCognitoAuthStatus
} from '../auth/cognito-auth-service'
import { appLog } from '../services/app-logger'
import * as gitlab from '../services/gitlab-api-client'
import * as observations from '../services/observations-service'
import * as draftStore from '../stores/draft-file-store'
import * as rememberedStore from '../stores/remembered-login-store'
import * as sessionStore from '../stores/session-store'
import {
  hasAwsLocalCredentials,
  loadAwsLocalCredentials,
  resolveAwsCredentialsDir,
  saveAwsLocalCredentials
} from '../stores/aws-credentials-store'
import { loadUserProfile, requireUserProfile, saveUserProfile } from '../stores/user-profile-store'
import type { AwsLocalStatus } from '../../shared/aws-local-credentials'

const abortByChannel = new Map<string, AbortController>()

function profileBootstrapFields(): {
  profile: UserProfile | null
  displayName: string | null
  awsPromptMode: boolean
  awsCredentialsConfigured: boolean
} {
  const profile = loadUserProfile()
  const awsPromptMode = isAwsPromptMode()
  return {
    profile,
    displayName: profile ? displayName(profile) : null,
    awsPromptMode,
    awsCredentialsConfigured: awsPromptMode ? hasAwsLocalCredentials() : true
  }
}

function takeAbort(key: string): AbortSignal {
  abortByChannel.get(key)?.abort()
  const c = new AbortController()
  abortByChannel.set(key, c)
  return c.signal
}

function requireAuth():
  | { ok: true; baseUrl: string; auth: Record<string, string> }
  | { ok: false; error: ReturnType<typeof VALIDATION_ERROR> } {
  const auth = sessionStore.getAuthHeaders()
  const baseUrl = sessionStore.getBaseUrl()
  if (!auth || !baseUrl || !sessionStore.isAuthenticated()) {
    return { ok: false, error: VALIDATION_ERROR('Sesion no autenticada.') }
  }
  return { ok: true, baseUrl, auth }
}

async function loginWithSecrets(): Promise<BootstrapInfo> {
  const secrets = getAppSecrets()
  const flags = getDevFlags()
  if (!secrets) {
    const missing = missingConfigKeys()
    const hasEnvFile = Boolean(findEnvFilePath())
    const detail =
      missing.length > 0
        ? `Faltan: ${missing.join(', ')}. Exportalas en el sistema (mismo nombre) o escribe el valor en .env (sin dejar la linea vacia). Luego reinicia npm run dev / el IDE.`
        : 'Falta configuracion. En local define AIDLC_CONFIG_API_URL en .env; en release ejecuta npm run dist con esa variable.'
    return {
      credentialsSource: hasEnvFile ? 'env' : 'none',
      // No mostrar formulario manual: la app usa solo .env / entorno del sistema
      credentialsLocked: true,
      authenticated: false,
      ...profileBootstrapFields(),
      devMode: flags.devMode,
      testRepoPath: flags.testRepoPath,
      error: VALIDATION_ERROR(detail)
    }
  }

  const base: Omit<BootstrapInfo, 'authenticated' | 'error'> = {
    credentialsSource: secrets.source,
    credentialsLocked: true,
    username: secrets.username,
    baseUrlLabel: secrets.baseUrl,
    ...profileBootstrapFields(),
    devMode: flags.devMode,
    testRepoPath: flags.testRepoPath
  }

  try {
    const normalized = gitlab.normalizeBaseUrl(secrets.baseUrl)
    const result = await gitlab.authenticateUser(normalized, secrets.username, secrets.password)
    if (!result.ok) {
      return { ...base, authenticated: false, error: result.error }
    }
    sessionStore.setSession({
      baseUrl: normalized,
      username: secrets.username,
      password: secrets.password,
      authMode: result.authMode,
      isAuthenticated: true
    })
    return { ...base, authenticated: true, username: secrets.username }
  } catch (e) {
    const err = asAppError(e)
    return {
      ...base,
      authenticated: false,
      error: err ?? VALIDATION_ERROR('No se pudo aplicar la configuracion.')
    }
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.getCognitoAuthStatus, async () => getCognitoAuthStatus())

  ipcMain.handle(
    IPC.cognitoLogin,
    async (_evt, req: { username?: string; password?: string }) => cognitoLogin(req ?? {})
  )

  ipcMain.handle(
    IPC.cognitoRespondNewPassword,
    async (
      _evt,
      req: { username?: string; session?: string; newPassword?: string }
    ) => cognitoRespondNewPassword(req ?? {})
  )

  ipcMain.handle(IPC.bootstrap, async (): Promise<BootstrapInfo> => {
    const cognito = getCognitoAuthStatus()
    if (!cognito.authenticated || !cognito.configLoaded) {
      const flags = getDevFlags()
      return {
        credentialsSource: 'none',
        credentialsLocked: true,
        authenticated: false,
        ...profileBootstrapFields(),
        devMode: flags.devMode,
        testRepoPath: flags.testRepoPath,
        error: VALIDATION_ERROR(
          cognito.apiConfigured
            ? 'Inicia sesion con Cognito para cargar la configuracion.'
            : 'Falta AIDLC_CONFIG_API_URL (define en .env o recompila con npm run dist).'
        )
      }
    }

    const flags = getDevFlags()
    if (sessionStore.isAuthenticated()) {
      const secrets = getAppSecrets()
      const session = sessionStore.getSession()
      return {
        credentialsSource: secrets?.source ?? 'none',
        credentialsLocked: Boolean(secrets),
        authenticated: true,
        username: session?.username,
        baseUrlLabel: session?.baseUrl ?? secrets?.baseUrl,
        ...profileBootstrapFields(),
        devMode: flags.devMode,
        testRepoPath: flags.testRepoPath
      }
    }
    return loginWithSecrets()
  })

  ipcMain.handle(IPC.getRememberedLogin, async (): Promise<RememberedLoginHint | null> => {
    if (getAppSecrets()) return null
    return rememberedStore.loadRememberedLogin()
  })

  ipcMain.handle(IPC.getUserProfile, async (): Promise<UserProfile | null> => {
    return loadUserProfile()
  })

  ipcMain.handle(IPC.getAwsLocalStatus, async (): Promise<AwsLocalStatus> => {
    const promptMode = isAwsPromptMode()
    const local = promptMode ? loadAwsLocalCredentials() : null
    return {
      promptMode,
      configured: promptMode ? Boolean(local) : true,
      storageDir: promptMode ? resolveAwsCredentialsDir() : undefined,
      region: getResolvedAwsRegion()
    }
  })

  ipcMain.handle(
    IPC.saveAwsLocalCredentials,
    async (
      _evt,
      req: {
        accessKeyId?: string
        secretAccessKey?: string
      }
    ): Promise<AidlcResult<{ configured: true; region: string }>> => {
      if (!isAwsPromptMode()) {
        return {
          ok: false,
          error: VALIDATION_ERROR(
            'AIDLC_DEV_MODE=true: las credenciales AWS se toman del entorno/.env, no del formulario.'
          )
        }
      }
      const saved = saveAwsLocalCredentials({
        accessKeyId: String(req?.accessKeyId ?? ''),
        secretAccessKey: String(req?.secretAccessKey ?? '')
      })
      if (!saved.ok) {
        appLog('warn', 'saveAwsLocalCredentials validation failed', {
          message: saved.message
        })
        return { ok: false, error: VALIDATION_ERROR(saved.message) }
      }
      clearAwsBedrockConfigCache()
      const region = getResolvedAwsRegion()
      appLog('info', 'AWS local credentials saved', {
        region,
        dir: resolveAwsCredentialsDir()
      })
      return { ok: true, data: { configured: true, region } }
    }
  )

  ipcMain.handle(
    IPC.saveUserProfile,
    async (
      _evt,
      req: { firstName?: string; lastName?: string }
    ): Promise<AidlcResult<UserProfile>> => {
      const saved = saveUserProfile({
        firstName: String(req?.firstName ?? ''),
        lastName: String(req?.lastName ?? '')
      })
      if (!saved.ok) {
        appLog('warn', 'saveUserProfile validation failed', { message: saved.message })
        return { ok: false, error: VALIDATION_ERROR(saved.message) }
      }
      appLog('info', 'User profile saved', { displayName: displayName(saved.data) })
      return { ok: true, data: saved.data }
    }
  )

  ipcMain.handle(
    IPC.login,
    async (_evt, req: LoginRequest): Promise<AidlcResult<{ username: string }>> => {
      if (getAppSecrets()) {
        appLog('warn', 'Manual login blocked; credentials locked by config')
        return {
          ok: false,
          error: VALIDATION_ERROR(
            'Las credenciales estan fijadas por configuracion (.env o compilacion) y no se pueden cambiar en la UI.'
          )
        }
      }
      if (!req?.baseUrl?.trim() || !req?.username?.trim() || !req?.password) {
        return { ok: false, error: VALIDATION_ERROR('Usuario, clave y URL son obligatorios.') }
      }
      try {
        const normalized = gitlab.normalizeBaseUrl(req.baseUrl)
        const username = req.username.trim()
        const result = await gitlab.authenticateUser(normalized, username, req.password)
        if (!result.ok) {
          appLog('warn', 'Login failed', { username, code: result.error.code })
          return result
        }
        sessionStore.setSession({
          baseUrl: normalized,
          username,
          password: req.password,
          authMode: result.authMode,
          isAuthenticated: true
        })
        rememberedStore.saveRememberedLogin({
          baseUrl: normalized,
          username
        })
        appLog('info', 'Login success', { username })
        return { ok: true, data: { username } }
      } catch (e) {
        const err = asAppError(e)
        appLog('error', 'Login exception', { message: err?.message ?? String(e) })
        if (err) return { ok: false, error: err }
        return { ok: false, error: VALIDATION_ERROR('URL invalida.') }
      }
    }
  )

  ipcMain.handle(IPC.logout, async (): Promise<AidlcResult<null>> => {
    draftStore.clearAllDrafts()
    cognitoLogout()
    const { clearAllChatSessions } = await import('../stores/chat-session-store')
    clearAllChatSessions()
    appLog('info', 'Logout completed')
    return { ok: true, data: null }
  })

  ipcMain.handle(
    IPC.listRepos,
    async (_evt, req: ListReposRequest = {}): Promise<AidlcResult<RepoListResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      const signal = takeAbort('list-repos')
      const flags = getDevFlags()
      return gitlab.listProjects(gate.baseUrl, gate.auth, {
        page: req.page,
        pageSize: req.pageSize,
        search: req.search,
        signal,
        devTestRepoPath: flags.devMode ? flags.testRepoPath : null
      })
    }
  )

  ipcMain.handle(
    IPC.openRepo,
    async (
      _evt,
      payload: { projectId: number; pathWithNamespace: string }
    ): Promise<AidlcResult<SelectedProjectContext>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!payload?.projectId) {
        return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      }
      const signal = takeAbort('open-repo')
      const check = await gitlab.branchExists(
        gate.baseUrl,
        gate.auth,
        payload.projectId,
        'dev',
        signal
      )
      if (!check.ok) {
        appLog('warn', 'openRepo failed branch check', {
          projectId: payload.projectId,
          code: check.error.code
        })
        return check
      }
      appLog('info', 'Repo opened', {
        projectId: payload.projectId,
        pathWithNamespace: payload.pathWithNamespace
      })
      return {
        ok: true,
        data: {
          projectId: payload.projectId,
          pathWithNamespace: payload.pathWithNamespace,
          branch: 'dev'
        }
      }
    }
  )

  ipcMain.handle(
    IPC.listTree,
    async (_evt, req: ListTreeRequest): Promise<AidlcResult<TreeNode[]>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort(`list-tree-${req.path ?? 'root'}`)
      return gitlab.listTree(
        gate.baseUrl,
        gate.auth,
        req.projectId,
        req.path ?? DOCS_ROOT,
        signal
      )
    }
  )

  ipcMain.handle(
    IPC.getFile,
    async (_evt, req: GetFileRequest): Promise<AidlcResult<FileContent>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId || !req?.path) {
        return { ok: false, error: VALIDATION_ERROR('Archivo invalido.') }
      }
      const signal = takeAbort(`get-file-${req.path}`)
      const remote = await gitlab.getFileContent(
        gate.baseUrl,
        gate.auth,
        req.projectId,
        req.path,
        signal
      )
      if (!remote.ok) return remote
      // Inception docs are read-only; only observations files use local drafts
      if (isObservationsFilePath(remote.data.path)) {
        const draft = draftStore.readDraft(req.projectId, remote.data.path)
        if (draft != null) {
          return {
            ok: true,
            data: { ...remote.data, content: draft, fromDraft: true }
          }
        }
      }
      return { ok: true, data: { ...remote.data, fromDraft: false } }
    }
  )

  ipcMain.handle(
    IPC.saveDraft,
    async (_evt, req: DraftRequest): Promise<AidlcResult<null>> => {
      if (!req?.projectId || !req?.path || req.content == null) {
        return { ok: false, error: VALIDATION_ERROR('Borrador invalido.') }
      }
      if (!isObservationsFilePath(req.path)) {
        return {
          ok: false,
          error: VALIDATION_ERROR(
            'Los documentos AIDLC son de solo lectura. Solo se pueden guardar observaciones.'
          )
        }
      }
      try {
        draftStore.saveDraft(req.projectId, req.path, req.content)
        return { ok: true, data: null }
      } catch (e) {
        const err = asAppError(e)
        return { ok: false, error: err ?? VALIDATION_ERROR('No se pudo guardar el borrador.') }
      }
    }
  )

  ipcMain.handle(
    IPC.discardDraft,
    async (_evt, req: DraftRequest): Promise<AidlcResult<FileContent | null>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId || !req?.path) {
        return { ok: false, error: VALIDATION_ERROR('Borrador invalido.') }
      }
      try {
        draftStore.discardDraft(req.projectId, req.path)
      } catch (e) {
        const err = asAppError(e)
        return { ok: false, error: err ?? VALIDATION_ERROR('No se pudo descartar el borrador.') }
      }
      const signal = takeAbort(`get-file-${req.path}`)
      const remote = await gitlab.getFileContent(
        gate.baseUrl,
        gate.auth,
        req.projectId,
        req.path,
        signal
      )
      if (!remote.ok) return remote
      return { ok: true, data: { ...remote.data, fromDraft: false } }
    }
  )

  ipcMain.handle(
    IPC.clearProjectDrafts,
    async (_evt, payload: { projectId: number }): Promise<AidlcResult<null>> => {
      if (!payload?.projectId) {
        return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      }
      try {
        draftStore.clearProjectDrafts(payload.projectId)
        return { ok: true, data: null }
      } catch (e) {
        const err = asAppError(e)
        return { ok: false, error: err ?? VALIDATION_ERROR('No se pudieron limpiar borradores.') }
      }
    }
  )

  ipcMain.handle(
    IPC.fileRecentDiff,
    async (_evt, req: RecentDiffRequest): Promise<AidlcResult<RecentDiffView>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId || !req?.path) {
        return { ok: false, error: VALIDATION_ERROR('Archivo invalido.') }
      }
      const signal = takeAbort(`diff-${req.path}`)
      return gitlab.getFileRecentDiff(
        gate.baseUrl,
        gate.auth,
        req.projectId,
        req.path,
        signal
      )
    }
  )

  ipcMain.handle(
    IPC.listDrafts,
    async (_evt, payload: { projectId: number }): Promise<AidlcResult<DraftSummary[]>> => {
      if (!payload?.projectId) {
        return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      }
      try {
        return { ok: true, data: draftStore.listDrafts(payload.projectId) }
      } catch (e) {
        const err = asAppError(e)
        return { ok: false, error: err ?? VALIDATION_ERROR('No se pudieron listar borradores.') }
      }
    }
  )

  ipcMain.handle(
    IPC.observationsGet,
    async (
      _evt,
      req: ObservationsGetRequest
    ): Promise<AidlcResult<ObservationsState>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort('observations-get')
      return observations.getObservationsState({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        signal
      })
    }
  )

  ipcMain.handle(
    IPC.observationsSave,
    async (
      _evt,
      req: ObservationsSaveRequest
    ): Promise<AidlcResult<ObservationsState>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const current = await observations.getObservationsState({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId
      })
      if (!current.ok) return current
      const profile = requireUserProfile()
      return observations.saveObservationsContent({
        projectId: req.projectId,
        content: req.content ?? '',
        path: current.data.path,
        profile
      })
    }
  )

  ipcMain.handle(
    IPC.observationsAppend,
    async (
      _evt,
      req: ObservationsAppendRequest
    ): Promise<AidlcResult<ObservationsAppendResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort('observations-append')
      return observations.appendObservation({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        text: req.text ?? '',
        relatedPath: req.relatedPath,
        signal
      })
    }
  )

  ipcMain.handle(
    IPC.observationsClose,
    async (
      _evt,
      req: ObservationsCloseRequest
    ): Promise<AidlcResult<ObservationsPushResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort('observations-close')
      return observations.closeAndPushObservations({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        signal
      })
    }
  )

  ipcMain.handle(
    IPC.observationsPull,
    async (
      _evt,
      req: ObservationsPullRequest
    ): Promise<AidlcResult<ObservationsPullResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort('observations-pull')
      const result = await observations.pullObservations({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        forceOwnRefresh: req.forceOwnRefresh,
        signal
      })
      if (result.ok) {
        appLog('info', 'Observations pull completed', { projectId: req.projectId })
      } else {
        appLog('warn', 'Observations pull failed', {
          projectId: req.projectId,
          code: result.error.code
        })
      }
      return result
    }
  )

  ipcMain.handle(
    IPC.chatGetSession,
    async (
      _evt,
      req: { projectId: number }
    ): Promise<AidlcResult<import('../../shared/chat-rag').ChatSessionState>> => {
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const { getChatSession } = await import('../stores/chat-session-store')
      const { getLanceStore } = await import('../services/lancedb-store')
      const { setIndexMeta } = await import('../stores/chat-session-store')
      const count = getLanceStore(req.projectId).count()
      setIndexMeta(req.projectId, { chunkCount: count, ready: count > 0 })
      return { ok: true, data: getChatSession(req.projectId) }
    }
  )

  ipcMain.handle(
    IPC.chatSend,
    async (
      _evt,
      req: import('../../shared/chat-rag').ChatSendRequest
    ): Promise<AidlcResult<import('../../shared/chat-rag').ChatSendResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort(`chat-send-${req.projectId}`)
      const { chatSend } = await import('../services/chat-rag-service')
      const result = await chatSend({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        message: req.message ?? '',
        openPath: req.openPath,
        signal
      })
      if (result.ok) {
        appLog('info', 'Chat message completed', {
          projectId: req.projectId,
          tokensTotal: result.data.usage?.totalTokens
        })
      } else {
        appLog('warn', 'Chat message failed', {
          projectId: req.projectId,
          code: result.error.code
        })
      }
      return result
    }
  )

  ipcMain.handle(
    IPC.ragReindex,
    async (
      _evt,
      req: { projectId: number }
    ): Promise<AidlcResult<import('../../shared/chat-rag').RagReindexResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort(`rag-reindex-${req.projectId}`)
      const { reindexProject } = await import('../services/rag-index-service')
      return reindexProject({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        signal
      })
    }
  )

  ipcMain.handle(
    IPC.ragEnsureIndex,
    async (
      _evt,
      req: { projectId: number }
    ): Promise<AidlcResult<import('../../shared/chat-rag').RagReindexResult>> => {
      const gate = requireAuth()
      if (!gate.ok) return gate
      if (!req?.projectId) return { ok: false, error: VALIDATION_ERROR('Proyecto invalido.') }
      const signal = takeAbort(`rag-ensure-${req.projectId}`)
      const { ensureIndex } = await import('../services/rag-index-service')
      return ensureIndex({
        baseUrl: gate.baseUrl,
        auth: gate.auth,
        projectId: req.projectId,
        signal
      })
    }
  )
}
