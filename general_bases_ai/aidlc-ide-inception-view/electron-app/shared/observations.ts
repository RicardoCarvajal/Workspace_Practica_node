import { INCEPTION_ROOT } from './path-guard'
import type { UserProfile } from './user-profile'
import { authorSlug, displayName } from './user-profile'

/** Directory for observation docs (per desktop user profile). */
export const OBSERVATIONS_DIR = `${INCEPTION_ROOT}/observations`

/** Legacy Spanish directory — still readable for older repos. */
export const LEGACY_OBSERVATIONS_DIR = `${INCEPTION_ROOT}/observaciones`

/** Slug segment in filename: lowercase letters/digits with hyphens. */
export const OBSERVATIONS_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const FILE_PREFIX = 'observations'
const LEGACY_FILE_PREFIX = 'observaciones'

/**
 * Numbered observation file:
 * `aidlc-docs/inception/observations/observations-{slug}-{n}.md`
 */
export function observationsFilePath(slug: string, sequence: number): string {
  const s = slug.trim().toLowerCase()
  if (!OBSERVATIONS_SLUG_RE.test(s)) {
    throw new Error(`Identificador de observaciones invalido: ${slug}`)
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Numero de observaciones invalido: ${sequence}`)
  }
  return `${OBSERVATIONS_DIR}/${FILE_PREFIX}-${s}-${sequence}.md`
}

export function observationsFilePathForProfile(
  profile: UserProfile,
  sequence: number
): string {
  return observationsFilePath(authorSlug(profile), sequence)
}

function observationsFilePathPattern(dir: string, prefix: string): RegExp {
  return new RegExp(
    `^${dir.replace(/\//g, '\\/')}/${prefix}-[a-z0-9]+(?:-[a-z0-9]+)*(?:-\\d+)?\\.md$`,
    'i'
  )
}

/** Accepts numbered files and legacy unnumbered `{prefix}-{slug}.md` under both dirs. */
export function isObservationsFilePath(path: string): boolean {
  const n = path.replace(/\\/g, '/')
  return (
    observationsFilePathPattern(OBSERVATIONS_DIR, FILE_PREFIX).test(n) ||
    observationsFilePathPattern(OBSERVATIONS_DIR, LEGACY_FILE_PREFIX).test(n) ||
    observationsFilePathPattern(LEGACY_OBSERVATIONS_DIR, FILE_PREFIX).test(n) ||
    observationsFilePathPattern(LEGACY_OBSERVATIONS_DIR, LEGACY_FILE_PREFIX).test(n)
  )
}

export function isUnderObservationsDir(path: string): boolean {
  const n = path.replace(/\\/g, '/')
  return (
    n === OBSERVATIONS_DIR ||
    n.startsWith(`${OBSERVATIONS_DIR}/`) ||
    n === LEGACY_OBSERVATIONS_DIR ||
    n.startsWith(`${LEGACY_OBSERVATIONS_DIR}/`)
  )
}

export function isOwnObservationsPath(path: string, slug: string): boolean {
  return extractObservationsSequence(path, slug) != null
}

/**
 * Sequence from path for this author slug.
 * Numbered: `...-slug-3.md` → 3.
 * Legacy unnumbered `...-slug.md` → treated as 1 (so the next file is 2).
 */
export function extractObservationsSequence(path: string, slug: string): number | null {
  const n = path.replace(/\\/g, '/')
  const s = slug.trim().toLowerCase()
  if (!OBSERVATIONS_SLUG_RE.test(s)) return null
  const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  for (const dir of [OBSERVATIONS_DIR, LEGACY_OBSERVATIONS_DIR]) {
    for (const prefix of [FILE_PREFIX, LEGACY_FILE_PREFIX]) {
      const dirEsc = dir.replace(/\//g, '\\/')
      const numbered = new RegExp(
        `^${dirEsc}/${prefix}-${escaped}-(\\d+)\\.md$`,
        'i'
      )
      const m = n.match(numbered)
      if (m) {
        const seq = Number(m[1])
        return Number.isInteger(seq) && seq >= 1 ? seq : null
      }
      const legacy = new RegExp(`^${dirEsc}/${prefix}-${escaped}\\.md$`, 'i')
      if (legacy.test(n)) return 1
    }
  }
  return null
}

/** Next free sequence for this author among known repo paths. */
export function nextObservationsSequence(paths: string[], slug: string): number {
  let max = 0
  for (const p of paths) {
    const seq = extractObservationsSequence(p, slug)
    if (seq != null) max = Math.max(max, seq)
  }
  return max + 1
}

export function buildObservationsHeader(profile: UserProfile, sequence?: number): string {
  const name = displayName(profile)
  const slug = authorSlug(profile)
  const seqLabel = sequence != null ? ` · documento ${sequence}` : ''
  return [
    `# Observaciones — ${name}${seqLabel}`,
    '',
    `Archivo de observaciones de **${name}** (\`${slug}\`${sequence != null ? ` #${sequence}` : ''}) en ATE AI-DLC IDE.`,
    'Las entradas se enumeran en orden (Observacion 1, 2, …). Al cerrar el documento se hace push a la rama `dev` y se abre un archivo nuevo numerado. Pull a demanda desde la app.',
    '',
    '---',
    ''
  ].join('\n')
}

/** True if the markdown has at least one "## Observacion N" section. */
export function hasObservationEntries(content: string): boolean {
  return /^##\s+Observacion\s+\d+\b/im.test(content)
}

/** Next ordinal for "## Observacion N" headings. */
export function nextObservationNumber(content: string): number {
  const re = /^##\s+Observacion\s+(\d+)\b/gim
  let max = 0
  for (const m of content.matchAll(re)) {
    const n = Number(m[1])
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  return max + 1
}

export function formatObservationEntry(opts: {
  number: number
  text: string
  relatedPath?: string | null
  at?: Date
}): string {
  const at = (opts.at ?? new Date()).toISOString()
  const related = opts.relatedPath?.trim()
  const lines = [
    `## Observacion ${opts.number}`,
    '',
    `- **Fecha**: ${at}`,
    related ? `- **Documento**: \`${related}\`` : null,
    '',
    opts.text.trim(),
    '',
    '---',
    ''
  ]
  return lines.filter((l) => l != null).join('\n')
}
