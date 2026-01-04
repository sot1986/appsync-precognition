import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'
import { email } from '../src/utils'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test emailRule validation', () => {
  it.concurrent.each([
    'test@example.com',
    'user@domain.org',
    'name.lastname@company.co.uk',
    'user123@test-domain.com',
    'a@b.co',
  ])('validates valid email', (value) => {
    const result = rules.parse(value, ['regex', email])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'invalid-email',
    '@domain.com',
    'user@',
    'user@domain',
    'user.domain.com',
    'user @domain.com',
    'user@ domain.com',
    '',
    null,
  ])('invalidates invalid email', (value) => {
    const result = rules.parse(value, ['regex', email])
    expect(result.check).toBe(false)
  })

  // test non-string values
  it.concurrent.each([
    123,
    [],
    {},
    true,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse(value, ['regex', email])
    expect(result.check).toBe(false)
  })
})
