import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test stringRule validation', () => {
  it.concurrent.each([
    'hello',
    '',
    'a',
    'test string',
    '123',
    'true',
    ' ',
  ])('validates string values', (value) => {
    const result = rules.parse(value, 'string')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    123,
    true,
    false,
    null,
    undefined,
    [],
    {},
    0,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse(value, 'string')
    expect(result.check).toBe(false)
  })
})
