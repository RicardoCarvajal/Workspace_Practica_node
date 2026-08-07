import { describe, expect, it } from 'vitest'
import {
  OBSERVATIONS_DIR,
  LEGACY_OBSERVATIONS_DIR,
  OBSERVATIONS_SLUG_RE,
  buildObservationsHeader,
  extractObservationsSequence,
  formatObservationEntry,
  hasObservationEntries,
  isObservationsFilePath,
  isOwnObservationsPath,
  nextObservationNumber,
  nextObservationsSequence,
  observationsFilePath,
  observationsFilePathForProfile
} from '../../shared/observations'
import { authorSlug, displayName, validateUserProfile } from '../../shared/user-profile'

describe('user profile helpers', () => {
  it('builds display name and slug with hyphens', () => {
    const profile = { firstName: 'Juan', lastName: 'Pérez García' }
    expect(displayName(profile)).toBe('Juan Pérez García')
    expect(authorSlug(profile)).toBe('juan-perez-garcia')
    expect(OBSERVATIONS_SLUG_RE.test(authorSlug(profile))).toBe(true)
  })

  it('rejects empty names', () => {
    expect(validateUserProfile({ firstName: '', lastName: 'Perez' }).ok).toBe(false)
    expect(validateUserProfile({ firstName: 'Ana', lastName: '  ' }).ok).toBe(false)
  })
})

describe('observations helpers', () => {
  it('builds numbered path under observations/', () => {
    const profile = { firstName: 'Maria', lastName: 'Lopez' }
    expect(OBSERVATIONS_DIR).toBe('aidlc-docs/inception/observations')
    expect(LEGACY_OBSERVATIONS_DIR).toBe('aidlc-docs/inception/observaciones')
    expect(observationsFilePathForProfile(profile, 1)).toBe(
      'aidlc-docs/inception/observations/observations-maria-lopez-1.md'
    )
    expect(observationsFilePath('ricardo-carvajal-f', 1)).toBe(
      'aidlc-docs/inception/observations/observations-ricardo-carvajal-f-1.md'
    )
    expect(
      isObservationsFilePath(
        'aidlc-docs/inception/observations/observations-juan-perez-2.md'
      )
    ).toBe(true)
    expect(
      isObservationsFilePath('aidlc-docs/inception/observaciones/observaciones-juan-perez.md')
    ).toBe(true)
    expect(isObservationsFilePath('aidlc-docs/inception/requirements/requirements.md')).toBe(
      false
    )
  })

  it('computes next sequence including legacy Spanish paths', () => {
    const slug = 'ricardo-carvajal-f'
    expect(
      extractObservationsSequence(
        'aidlc-docs/inception/observations/observations-ricardo-carvajal-f-3.md',
        slug
      )
    ).toBe(3)
    expect(
      extractObservationsSequence(
        'aidlc-docs/inception/observaciones/observaciones-ricardo-carvajal-f.md',
        slug
      )
    ).toBe(1)
    expect(
      isOwnObservationsPath(
        'aidlc-docs/inception/observations/observations-ricardo-carvajal-f-1.md',
        slug
      )
    ).toBe(true)
    expect(
      nextObservationsSequence(
        [
          'aidlc-docs/inception/observaciones/observaciones-ricardo-carvajal-f.md',
          'aidlc-docs/inception/observations/observations-ricardo-carvajal-f-2.md',
          'aidlc-docs/inception/observations/observations-otro-1.md'
        ],
        slug
      )
    ).toBe(3)
    expect(nextObservationsSequence([], slug)).toBe(1)
  })

  it('enumerates observations while keeping author name in header', () => {
    const profile = { firstName: 'Ana', lastName: 'Ruiz' }
    const header = buildObservationsHeader(profile, 1)
    expect(header).toContain('Ana Ruiz')
    expect(header).toContain('ana-ruiz')
    expect(header).toContain('#1')
    expect(hasObservationEntries(header)).toBe(false)
    expect(nextObservationNumber(header)).toBe(1)
    const withOne =
      header +
      formatObservationEntry({
        number: 1,
        text: 'Primera',
        relatedPath: 'aidlc-docs/inception/requirements/requirements.md',
        at: new Date('2026-08-01T21:00:00.000Z')
      })
    expect(withOne).toContain('## Observacion 1')
    expect(hasObservationEntries(withOne)).toBe(true)
    expect(nextObservationNumber(withOne)).toBe(2)
  })
})
