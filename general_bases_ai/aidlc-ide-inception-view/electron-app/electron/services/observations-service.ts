import type {
  AppError,
  ObservationsAppendResult,
  ObservationsPullResult,
  ObservationsPushResult,
  ObservationsState
} from '../../shared/types'
import {
  OBSERVATIONS_DIR,
  LEGACY_OBSERVATIONS_DIR,
  buildObservationsHeader,
  formatObservationEntry,
  isOwnObservationsPath,
  nextObservationNumber,
  nextObservationsSequence,
  observationsFilePath,
  extractObservationsSequence
} from '../../shared/observations'
import { upsertObservationsReviewTask } from '../../shared/aidlc-state-observations'
import { AIDLC_STATE_PATH, asAppError } from '../../shared/path-guard'
import { DRAFT_ERROR, PUBLISH_ERROR, VALIDATION_ERROR } from '../../shared/errors'
import { authorSlug, displayName } from '../../shared/user-profile'
import { requireUserProfile } from '../stores/user-profile-store'
import * as draftStore from '../stores/draft-file-store'
import {
  getActiveObservationsPath,
  setActiveObservationsPath
} from '../stores/active-observations-store'
import * as gitlab from './gitlab-api-client'
import type { UserProfile } from '../../shared/user-profile'

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

function stateFrom(
  profile: UserProfile,
  path: string,
  opts: { content: string; fromDraft: boolean }
): ObservationsState {
  return {
    authorSlug: authorSlug(profile),
    displayName: displayName(profile),
    path,
    content: opts.content,
    fromDraft: opts.fromDraft
  }
}

async function listKnownObservationPaths(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<string[]> {
  const dirs = [OBSERVATIONS_DIR, LEGACY_OBSERVATIONS_DIR]
  const remote: string[] = []
  for (const dir of dirs) {
    const listed = await gitlab.listBlobPathsUnder(
      opts.baseUrl,
      opts.auth,
      opts.projectId,
      dir,
      opts.signal
    )
    if (listed.ok) remote.push(...listed.data)
  }
  const local = draftStore.listDrafts(opts.projectId).map((d) => d.path)
  return [...new Set([...remote, ...local])]
}

async function resolveWorkingPath(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ profile: UserProfile; path: string; sequence: number }> {
  const profile = requireUserProfile()
  const slug = authorSlug(profile)
  const active = getActiveObservationsPath(opts.projectId)
  if (active && isOwnObservationsPath(active, slug)) {
    const sequence = extractObservationsSequence(active, slug) ?? 1
    return { profile, path: active, sequence }
  }

  const ownDrafts = draftStore
    .listDrafts(opts.projectId)
    .map((d) => d.path)
    .filter((p) => isOwnObservationsPath(p, slug))
    .sort(
      (a, b) =>
        (extractObservationsSequence(b, slug) ?? 0) -
        (extractObservationsSequence(a, slug) ?? 0)
    )
  if (ownDrafts[0]) {
    const sequence = extractObservationsSequence(ownDrafts[0], slug) ?? 1
    setActiveObservationsPath(opts.projectId, ownDrafts[0])
    return { profile, path: ownDrafts[0], sequence }
  }

  const known = await listKnownObservationPaths(opts)
  const sequence = nextObservationsSequence(known, slug)
  const path = observationsFilePath(slug, sequence)
  setActiveObservationsPath(opts.projectId, path)
  return { profile, path, sequence }
}

async function loadRemoteOrEmpty(
  baseUrl: string,
  auth: Record<string, string>,
  projectId: number,
  path: string,
  header: string,
  signal?: AbortSignal
): Promise<string> {
  const remote = await gitlab.getFileContent(baseUrl, auth, projectId, path, signal)
  if (remote.ok) return remote.data.content
  return header
}

export async function getObservationsState(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ ok: true; data: ObservationsState } | { ok: false; error: AppError }> {
  try {
    const { profile, path, sequence } = await resolveWorkingPath(opts)
    const header = buildObservationsHeader(profile, sequence)
    const draft = draftStore.readDraft(opts.projectId, path)
    const content =
      draft ??
      (await loadRemoteOrEmpty(
        opts.baseUrl,
        opts.auth,
        opts.projectId,
        path,
        header,
        opts.signal
      ))

    if (draft == null) {
      draftStore.saveDraft(opts.projectId, path, content)
    }

    return {
      ok: true,
      data: stateFrom(profile, path, { content, fromDraft: true })
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    if (e instanceof Error && e.message.includes('Perfil')) {
      return { ok: false, error: VALIDATION_ERROR(e.message) }
    }
    return { ok: false, error: DRAFT_ERROR() }
  }
}

export async function saveObservationsContent(opts: {
  projectId: number
  content: string
  path: string
  profile: UserProfile
}): Promise<{ ok: true; data: ObservationsState } | { ok: false; error: AppError }> {
  try {
    if (!opts.content.trim()) {
      return {
        ok: false,
        error: VALIDATION_ERROR('El documento de observaciones no puede estar vacio.')
      }
    }
    draftStore.saveDraft(opts.projectId, opts.path, opts.content)
    setActiveObservationsPath(opts.projectId, opts.path)
    return {
      ok: true,
      data: stateFrom(opts.profile, opts.path, { content: opts.content, fromDraft: true })
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    if (e instanceof Error && e.message.includes('Perfil')) {
      return { ok: false, error: VALIDATION_ERROR(e.message) }
    }
    return { ok: false, error: DRAFT_ERROR() }
  }
}

export async function appendObservation(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  text: string
  relatedPath?: string | null
  signal?: AbortSignal
}): Promise<{ ok: true; data: ObservationsAppendResult } | { ok: false; error: AppError }> {
  const text = opts.text.trim()
  if (!text) {
    return { ok: false, error: VALIDATION_ERROR('Escribe una observacion antes de agregar.') }
  }

  // Always pull observations from `dev` before adding a new entry.
  const pulled = await pullObservations({
    baseUrl: opts.baseUrl,
    auth: opts.auth,
    projectId: opts.projectId,
    forceOwnRefresh: true,
    signal: opts.signal
  })
  if (!pulled.ok) return pulled

  const current = await getObservationsState({
    baseUrl: opts.baseUrl,
    auth: opts.auth,
    projectId: opts.projectId,
    signal: opts.signal
  })
  if (!current.ok) return current

  const profile = requireUserProfile()
  const sequence =
    extractObservationsSequence(current.data.path, authorSlug(profile)) ?? 1
  let body = current.data.content.trimEnd()
  if (!body.includes('# Observaciones')) {
    body = buildObservationsHeader(profile, sequence) + body
  }
  const number = nextObservationNumber(body)
  const entry = formatObservationEntry({
    number,
    text,
    relatedPath: opts.relatedPath
  })
  const next = `${body}\n\n${entry}`

  // Upsert review task in project aidlc-state.md and push to `dev` before saving local draft.
  const remoteState = await gitlab.getFileContent(
    opts.baseUrl,
    opts.auth,
    opts.projectId,
    AIDLC_STATE_PATH,
    opts.signal
  )
  let existingState: string
  if (remoteState.ok) {
    existingState = remoteState.data.content
  } else if (
    remoteState.error.code === 'validation_error' &&
    /no encontrado/i.test(remoteState.error.message)
  ) {
    existingState = '# AI-DLC State\n\n'
  } else {
    return remoteState
  }

  const { content: nextState, taskNumber } = upsertObservationsReviewTask(existingState, {
    displayName: displayName(profile),
    observationsPath: current.data.path
  })

  const statePush = await gitlab.pushFilesToDev(
    opts.baseUrl,
    opts.auth,
    opts.projectId,
    [{ path: AIDLC_STATE_PATH, content: nextState }],
    {
      commitMessage: `ATE AI-DLC IDE: Review observations ${current.data.path.split('/').pop()}`,
      signal: opts.signal
    }
  )
  if (!statePush.ok) return statePush

  const saved = await saveObservationsContent({
    projectId: opts.projectId,
    content: next,
    path: current.data.path,
    profile
  })
  if (!saved.ok) return saved

  const pullFiles = [...pulled.data.files]
  const ownIdx = pullFiles.findIndex((f) => f.path === saved.data.path)
  const ownEntry = {
    path: saved.data.path,
    content: saved.data.content,
    isOwn: true as const
  }
  if (ownIdx >= 0) pullFiles[ownIdx] = ownEntry
  else pullFiles.unshift(ownEntry)

  return {
    ok: true,
    data: {
      ...saved.data,
      pulledFileCount: pulled.data.files.length,
      pull: {
        ...pulled.data,
        files: pullFiles
      },
      reviewTaskNumber: taskNumber,
      stateCommitId: statePush.data.commitId
    }
  }
}

/**
 * Close observation document: push to `dev`, then open a new numbered empty file.
 */
export async function closeAndPushObservations(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ ok: true; data: ObservationsPushResult } | { ok: false; error: AppError }> {
  const current = await getObservationsState({
    baseUrl: opts.baseUrl,
    auth: opts.auth,
    projectId: opts.projectId,
    signal: opts.signal
  })
  if (!current.ok) return current

  const pushed = await gitlab.pushFilesToDev(
    opts.baseUrl,
    opts.auth,
    opts.projectId,
    [{ path: current.data.path, content: current.data.content }],
    {
      commitMessage: `ATE AI-DLC IDE: observaciones ${current.data.authorSlug}`,
      signal: opts.signal
    }
  )
  if (!pushed.ok) return pushed

  // Keep closed file draft aligned with what was pushed (historical).
  draftStore.saveDraft(opts.projectId, current.data.path, current.data.content)

  const profile = requireUserProfile()
  const slug = authorSlug(profile)
  const known = await listKnownObservationPaths(opts)
  // Ensure the just-pushed path counts toward the next sequence.
  if (!known.includes(current.data.path)) known.push(current.data.path)
  const sequence = nextObservationsSequence(known, slug)
  const nextPath = observationsFilePath(slug, sequence)
  const header = buildObservationsHeader(profile, sequence)
  draftStore.saveDraft(opts.projectId, nextPath, header)
  setActiveObservationsPath(opts.projectId, nextPath)

  return {
    ok: true,
    data: {
      branch: 'dev',
      commitId: pushed.data.commitId,
      path: current.data.path,
      authorSlug: current.data.authorSlug,
      displayName: current.data.displayName,
      filesCommitted: pushed.data.filesCommitted,
      nextPath
    }
  }
}

/**
 * Pull observation files from `dev`.
 * Own files: any path for the current author slug (numbered or legacy).
 */
export async function pullObservations(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  forceOwnRefresh?: boolean
  signal?: AbortSignal
}): Promise<{ ok: true; data: ObservationsPullResult } | { ok: false; error: AppError }> {
  try {
    const profile = requireUserProfile()
    const slug = authorSlug(profile)
    const activePath =
      getActiveObservationsPath(opts.projectId) ??
      (await resolveWorkingPath(opts)).path

    const listedPaths: string[] = []
    for (const dir of [OBSERVATIONS_DIR, LEGACY_OBSERVATIONS_DIR]) {
      const listed = await gitlab.listBlobPathsUnder(
        opts.baseUrl,
        opts.auth,
        opts.projectId,
        dir,
        opts.signal
      )
      if (!listed.ok) {
        if (listed.error.code === 'login_failed' || listed.error.code === 'request_cancelled') {
          return listed
        }
        continue
      }
      listedPaths.push(...listed.data)
    }

    const files: ObservationsPullResult['files'] = []
    for (const path of [...new Set(listedPaths)]) {
      const remote = await gitlab.getFileContent(
        opts.baseUrl,
        opts.auth,
        opts.projectId,
        path,
        opts.signal
      )
      if (!remote.ok) continue

      const own = isOwnObservationsPath(path, slug)
      if (own) {
        const local = draftStore.readDraft(opts.projectId, path)
        if (opts.forceOwnRefresh || local == null || local === remote.data.content) {
          draftStore.saveDraft(opts.projectId, path, remote.data.content)
          files.push({ path, content: remote.data.content, isOwn: true })
        } else {
          files.push({ path, content: local, isOwn: true })
        }
      } else {
        files.push({ path, content: remote.data.content, isOwn: false })
      }
    }

    if (!files.some((f) => f.path === activePath)) {
      const own = await getObservationsState({
        baseUrl: opts.baseUrl,
        auth: opts.auth,
        projectId: opts.projectId,
        signal: opts.signal
      })
      if (own.ok) {
        files.unshift({
          path: own.data.path,
          content: own.data.content,
          isOwn: true
        })
      }
    }

    files.sort((a, b) => {
      if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1
      return a.path.localeCompare(b.path)
    })

    const { getLanceStore } = await import('./lancedb-store')
    const chunkCount = getLanceStore(opts.projectId).count()

    return {
      ok: true,
      data: {
        pulledAt: new Date().toISOString(),
        files,
        indexChunkCount: chunkCount > 0 ? chunkCount : undefined
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    if (e instanceof Error && e.message.includes('Perfil')) {
      return { ok: false, error: VALIDATION_ERROR(e.message) }
    }
    return { ok: false, error: PUBLISH_ERROR('No se pudo actualizar observaciones desde GitLab.') }
  }
}
