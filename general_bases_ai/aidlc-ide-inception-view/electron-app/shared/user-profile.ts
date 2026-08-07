/** Local user identity for header + observation file naming. */

export interface UserProfile {
  firstName: string
  lastName: string
}

const NAME_PART_RE = /^[\p{L}\p{M}'’.\- ]{1,80}$/u

export function normalizeNamePart(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidNamePart(value: string): boolean {
  const n = normalizeNamePart(value)
  return n.length > 0 && NAME_PART_RE.test(n)
}

export function displayName(profile: UserProfile): string {
  return `${normalizeNamePart(profile.firstName)} ${normalizeNamePart(profile.lastName)}`.trim()
}

/**
 * Lowercase slug for observation filenames: "Juan Pérez" → "juan-perez".
 * Accents stripped; non-alphanumeric runs become a single hyphen.
 */
export function authorSlug(profile: UserProfile): string {
  const raw = displayName(profile)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!raw) {
    throw new Error('No se pudo generar el identificador a partir del nombre.')
  }
  return raw
}

export function validateUserProfile(
  input: { firstName?: string; lastName?: string }
): { ok: true; data: UserProfile } | { ok: false; message: string } {
  const firstName = normalizeNamePart(String(input.firstName ?? ''))
  const lastName = normalizeNamePart(String(input.lastName ?? ''))
  if (!isValidNamePart(firstName)) {
    return { ok: false, message: 'Ingresa un nombre valido.' }
  }
  if (!isValidNamePart(lastName)) {
    return { ok: false, message: 'Ingresa un apellido valido.' }
  }
  try {
    authorSlug({ firstName, lastName })
  } catch {
    return {
      ok: false,
      message: 'El nombre y apellido deben incluir al menos una letra o numero.'
    }
  }
  return { ok: true, data: { firstName, lastName } }
}
