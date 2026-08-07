import { describe, expect, it } from 'vitest'
import {
  INCEPTION_PHASE_HEADING,
  formatObservationsReviewTask,
  stripLegacyObservationsReviewSection,
  upsertObservationsReviewTask
} from '../../shared/aidlc-state-observations'

describe('aidlc-state observations review tasks', () => {
  it('appends under INCEPTION PHASE when missing', () => {
    const existing = [
      '# AI-DLC State',
      '',
      '## Stage Progress',
      '',
      '### CONSTRUCTION PHASE',
      '- [ ] Code Generation',
      ''
    ].join('\n')

    const { content, taskNumber, taskLine } = upsertObservationsReviewTask(existing, {
      observationsPath:
        'aidlc-docs/inception/observations/observations-ricardo-carvajal-f-1.md'
    })
    expect(taskNumber).toBe(1)
    expect(content).toContain(INCEPTION_PHASE_HEADING)
    expect(content).toContain(taskLine)
    expect(taskLine).toBe(
      '- [ ] Review observations observations-ricardo-carvajal-f-1.md'
    )
    expect(content.indexOf(INCEPTION_PHASE_HEADING)).toBeLessThan(
      content.indexOf('### CONSTRUCTION PHASE')
    )
  })

  it('appends next task under existing INCEPTION PHASE', () => {
    const existing = [
      '# AI-DLC State',
      '',
      '## Stage Progress',
      '',
      '### INCEPTION PHASE',
      '- [x] Workspace Detection',
      '- [ ] Review observations observations-ana-1.md',
      '',
      '### CONSTRUCTION PHASE',
      '- [ ] Build',
      ''
    ].join('\n')

    const { content, taskNumber, taskLine } = upsertObservationsReviewTask(existing, {
      observationsPath: 'aidlc-docs/inception/observations/observations-ana-2.md'
    })
    expect(taskNumber).toBe(2)
    expect(taskLine).toBe('- [ ] Review observations observations-ana-2.md')
    expect(content).toContain('- [ ] Review observations observations-ana-1.md')
    expect(content).toContain(taskLine)
    expect(content.indexOf('observations-ana-2.md')).toBeLessThan(
      content.indexOf('### CONSTRUCTION PHASE')
    )
  })

  it('strips legacy Observaciones por revisar section on upsert', () => {
    const existing = [
      '# AI-DLC State',
      '',
      '## Observaciones por revisar',
      '',
      '- [ ] 1. Revisar observaciones de **Ana** (`x.md`)',
      '',
      '## Stage Progress',
      '',
      '### INCEPTION PHASE',
      '- [x] Workspace Detection',
      '',
      '### CONSTRUCTION PHASE',
      '- [ ] Build',
      ''
    ].join('\n')

    const stripped = stripLegacyObservationsReviewSection(existing)
    expect(stripped).not.toContain('## Observaciones por revisar')
    expect(stripped).toContain('### INCEPTION PHASE')

    const { content, taskLine } = upsertObservationsReviewTask(existing, {
      observationsPath: 'aidlc-docs/inception/observations/observations-ana-1.md'
    })
    expect(content).not.toContain('## Observaciones por revisar')
    expect(taskLine).toBe('- [ ] Review observations observations-ana-1.md')
    expect(content).toContain(taskLine)
  })

  it('formats a task line in English with file name only', () => {
    expect(
      formatObservationsReviewTask({
        observationsPath: 'aidlc-docs/inception/observations/observations-juan-1.md'
      })
    ).toBe('- [ ] Review observations observations-juan-1.md')
  })
})
