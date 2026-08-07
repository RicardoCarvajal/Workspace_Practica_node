import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { UserProfile } from '../../shared/user-profile'
import { validateUserProfile } from '../../shared/user-profile'

function storePath(): string {
  return join(app.getPath('userData'), 'user-profile.json')
}

export function loadUserProfile(): UserProfile | null {
  const file = storePath()
  try {
    if (!existsSync(file)) return null
    const raw = JSON.parse(readFileSync(file, 'utf8')) as {
      firstName?: string
      lastName?: string
    }
    const validated = validateUserProfile(raw)
    return validated.ok ? validated.data : null
  } catch {
    return null
  }
}

export function saveUserProfile(input: {
  firstName: string
  lastName: string
}): { ok: true; data: UserProfile } | { ok: false; message: string } {
  const validated = validateUserProfile(input)
  if (!validated.ok) return validated

  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(
    storePath(),
    JSON.stringify(
      {
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        savedAt: new Date().toISOString()
      },
      null,
      2
    ),
    'utf8'
  )
  return { ok: true, data: validated.data }
}

export function requireUserProfile(): UserProfile {
  const profile = loadUserProfile()
  if (!profile) {
    throw new Error('Perfil de usuario no configurado. Reinicia la aplicacion e ingresa nombre y apellido.')
  }
  return profile
}
