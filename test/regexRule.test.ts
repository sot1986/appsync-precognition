import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test regexRule validation', () => {
  it.concurrent.each([
    ['abc123', '^[a-z]+[0-9]+$'],
    ['hello', '^[a-z]+$'],
    ['123', '^[0-9]+$'],
    ['test@example.com', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'],
  ])('validates string matching regex pattern', (value, pattern) => {
    const result = rules.parse(value, [`regex`, pattern])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    ['abc', '^[0-9]+$'],
    ['123abc', '^[0-9]+$'],
    ['invalid-email', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'],
    ['', '^[a-z]+$'],
    ['ABC', '^[a-z]+$'],
  ])('invalidates string not matching regex pattern', (value, pattern) => {
    const result = rules.parse(value, [`regex`, pattern])
    expect(result.check).toBe(false)
  })

  // test non-string values
  it.concurrent.each([
    123,
    [],
    {},
    true,
    null,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse(value, ['regex', '^[a-z]+$'])
    expect(result.check).toBe(false)
  })
})
