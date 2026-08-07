import { describe, expect, it } from 'vitest'
import { validateAwsLocalCredentials } from '../../shared/aws-local-credentials'

describe('aws-local-credentials', () => {
  it('validates keys without region (region comes from runtime/env)', () => {
    expect(
      validateAwsLocalCredentials({
        accessKeyId: 'AKIA',
        secretAccessKey: 'secret'
      }).ok
    ).toBe(true)
    expect(
      validateAwsLocalCredentials({
        accessKeyId: '',
        secretAccessKey: 'secret'
      }).ok
    ).toBe(false)
  })
})
