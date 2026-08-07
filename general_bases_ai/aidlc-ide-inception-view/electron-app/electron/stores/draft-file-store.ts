import { app } from 'electron'
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  rmSync,
  existsSync,
  readdirSync
} from 'fs'
import { join, dirname } from 'path'
import { assertAllowedRepoPath, asAppError } from '../../shared/path-guard'
import { DRAFT_ERROR } from '../../shared/errors'
import type { DraftSummary } from '../../shared/types'

function draftsRoot(): string {
  return join(app.getPath('userData'), 'drafts')
}

function draftFilePath(projectId: number, repoPath: string): string {
  const safe = assertAllowedRepoPath(repoPath).replace(/\//g, '__')
  return join(draftsRoot(), String(projectId), `${safe}.draft`)
}

function fileNameToRepoPath(fileName: string): string | null {
  if (!fileName.endsWith('.draft')) return null
  const encoded = fileName.slice(0, -'.draft'.length)
  const path = encoded.replace(/__/g, '/')
  try {
    return assertAllowedRepoPath(path)
  } catch {
    return null
  }
}

export function readDraft(projectId: number, repoPath: string): string | null {
  try {
    const file = draftFilePath(projectId, repoPath)
    if (!existsSync(file)) return null
    return readFileSync(file, 'utf8')
  } catch (e) {
    if (asAppError(e)) throw e
    return null
  }
}

export function saveDraft(projectId: number, repoPath: string, content: string): void {
  try {
    const file = draftFilePath(projectId, repoPath)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content, 'utf8')
  } catch (e) {
    if (asAppError(e)) throw e
    throw DRAFT_ERROR()
  }
}

export function discardDraft(projectId: number, repoPath: string): void {
  try {
    const file = draftFilePath(projectId, repoPath)
    if (existsSync(file)) unlinkSync(file)
  } catch (e) {
    if (asAppError(e)) throw e
    throw DRAFT_ERROR()
  }
}

export function listDrafts(projectId: number): DraftSummary[] {
  const dir = join(draftsRoot(), String(projectId))
  if (!existsSync(dir)) return []
  const out: DraftSummary[] = []
  for (const name of readdirSync(dir)) {
    const path = fileNameToRepoPath(name)
    if (!path) continue
    try {
      const content = readFileSync(join(dir, name), 'utf8')
      out.push({ path, content })
    } catch {
      /* skip unreadable */
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path))
}

export function clearProjectDrafts(projectId: number): void {
  try {
    const dir = join(draftsRoot(), String(projectId))
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  } catch {
    throw DRAFT_ERROR()
  }
}

export function clearAllDrafts(): void {
  try {
    const root = draftsRoot()
    if (existsSync(root)) rmSync(root, { recursive: true, force: true })
  } catch {
    /* best effort on logout */
  }
}
