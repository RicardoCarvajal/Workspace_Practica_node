import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const FILE_NAME = 'active-observations.json'

type ActiveMap = Record<string, string>

function storePath(): string {
  return join(app.getPath('userData'), FILE_NAME)
}

function loadMap(): ActiveMap {
  try {
    const file = storePath()
    if (!existsSync(file)) return {}
    const raw = JSON.parse(readFileSync(file, 'utf8')) as ActiveMap
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function saveMap(map: ActiveMap): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(storePath(), JSON.stringify(map, null, 2), 'utf8')
}

export function getActiveObservationsPath(projectId: number): string | null {
  const path = loadMap()[String(projectId)]
  return typeof path === 'string' && path.trim() ? path.trim() : null
}

export function setActiveObservationsPath(projectId: number, path: string): void {
  const map = loadMap()
  map[String(projectId)] = path
  saveMap(map)
}

export function clearActiveObservationsPath(projectId: number): void {
  const map = loadMap()
  delete map[String(projectId)]
  saveMap(map)
}
