/** Helpers to maintain observation review tasks in aidlc-docs/aidlc-state.md */

/** Tasks are appended under the AI-DLC Stage Progress inception block. */
export const INCEPTION_PHASE_HEADING = '### INCEPTION PHASE'

/** Legacy section — removed on upsert; no longer written. */
export const LEGACY_OBSERVATIONS_REVIEW_HEADING = '## Observaciones por revisar'

const REVIEW_TASK_RE = /^\-\s\[[ xX]\]\s+Review observations\b/gm
const LEGACY_REVIEW_TASK_RE = /^\-\s\[[ xX]\]\s+Revisar observaciones\b/gm

function fileNameFromPath(path: string): string {
  const n = path.replace(/\\/g, '/')
  const parts = n.split('/')
  return parts[parts.length - 1] || n
}

/**
 * Removes the obsolete `## Observaciones por revisar` section (if present).
 */
export function stripLegacyObservationsReviewSection(content: string): string {
  const headingRe = /^## Observaciones por revisar\s*$/m
  const match = content.match(headingRe)
  if (!match || match.index == null) return content

  const start = match.index
  const afterHeading = content.slice(start + match[0].length)
  const nextHeadingRel = afterHeading.search(/\n##\s+/)
  const end =
    nextHeadingRel >= 0 ? start + match[0].length + nextHeadingRel : content.length
  const before = content.slice(0, start).replace(/\s+$/, '')
  const after = content.slice(end).replace(/^\s+/, '')
  if (!before) return after ? `${after.replace(/\s+$/, '')}\n` : ''
  if (!after) return `${before}\n`
  return `${before}\n\n${after.replace(/\s+$/, '')}\n`
}

/**
 * Checklist item under INCEPTION PHASE:
 * `- [ ] Review observations observations-slug-1.md`
 */
export function formatObservationsReviewTask(opts: {
  observationsPath: string
}): string {
  return `- [ ] Review observations ${fileNameFromPath(opts.observationsPath)}`
}

/**
 * Ensures `### INCEPTION PHASE` exists and appends a review task for the observation file.
 * Drops the legacy `## Observaciones por revisar` section when present.
 * If INCEPTION PHASE is missing, it is created under `## Stage Progress` when present, else at EOF.
 */
export function upsertObservationsReviewTask(
  existingContent: string,
  opts: {
    observationsPath: string
    displayName?: string
    at?: Date
  }
): { content: string; taskNumber: number; taskLine: string } {
  const cleaned = stripLegacyObservationsReviewSection(existingContent)
  const base = cleaned.replace(/\s+$/, '')
  const heading = INCEPTION_PHASE_HEADING
  const taskLine = formatObservationsReviewTask({
    observationsPath: opts.observationsPath
  })

  const headingIndex = base.search(/^### INCEPTION PHASE\s*$/m)

  if (headingIndex < 0) {
    const block = [heading, '', taskLine, ''].join('\n')
    const stageIdx = base.search(/^## Stage Progress\s*$/m)
    let content: string
    if (stageIdx >= 0) {
      const stageLineEnd = base.indexOf('\n', stageIdx)
      let insertAt = stageLineEnd >= 0 ? stageLineEnd + 1 : base.length
      while (base[insertAt] === '\n') insertAt++
      const before = base.slice(0, insertAt).replace(/\s+$/, '')
      const after = base.slice(insertAt)
      content = `${before}\n\n${block}${after ? `\n${after.replace(/^\n+/, '')}` : ''}`
    } else {
      content = base ? `${base}\n\n${block}` : `${block}`
    }
    return { content: content.replace(/\s+$/, '') + '\n', taskNumber: 1, taskLine }
  }

  const afterHeading = base.slice(headingIndex + heading.length)
  const nextHeadingRel = afterHeading.search(/\n#{2,3}\s+/)
  const sectionBody =
    nextHeadingRel >= 0 ? afterHeading.slice(0, nextHeadingRel) : afterHeading
  const rest = nextHeadingRel >= 0 ? afterHeading.slice(nextHeadingRel) : ''

  const existingCount =
    (sectionBody.match(REVIEW_TASK_RE) || []).length +
    (sectionBody.match(LEGACY_REVIEW_TASK_RE) || []).length
  const taskNumber = existingCount + 1

  const bodyTrimmed = sectionBody.replace(/\s+$/, '')
  const newSectionBody = `${bodyTrimmed}\n${taskLine}\n`
  const before = base.slice(0, headingIndex + heading.length)
  const content = `${before}${newSectionBody}${rest}`.replace(/\s+$/, '') + '\n'
  return { content, taskNumber, taskLine }
}
