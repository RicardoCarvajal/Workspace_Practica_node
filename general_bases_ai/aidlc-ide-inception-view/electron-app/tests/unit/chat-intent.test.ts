import { describe, expect, it } from 'vitest'
import { looksLikeModificationRequest } from '../../shared/chat-intent'

describe('looksLikeModificationRequest', () => {
  it('detects unify/edit verbs', () => {
    expect(looksLikeModificationRequest('Puedes unificar estas historias?')).toBe(true)
    expect(looksLikeModificationRequest('Actualiza FR-01')).toBe(true)
    expect(looksLikeModificationRequest('modifica el archivo de brecha')).toBe(true)
  })

  it('does not flag pure questions', () => {
    expect(looksLikeModificationRequest('Dime si hay HU relacionadas')).toBe(false)
    expect(looksLikeModificationRequest('Que dice el requisito FR-01?')).toBe(false)
  })
})
