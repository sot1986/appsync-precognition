import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test arrayRule validation', () => {
  it.concurrent.each([
    [] as unknown[],
    [1] as unknown[],
    [1, 2, 3] as unknown[],
    ['a', 'b', 'c'] as unknown[],
    [true, false] as unknown[],
    [null, undefined] as unknown[],
    [{ a: 1 }, { b: 2 }] as unknown[],
  ])('validates array values', (...value) => {
    const result = rules.parse({ value }, 'array')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'string',
    123,
    true,
    false,
    null,
    undefined,
    { key: 'value' },
  ])('invalidates non-array values', (value) => {
    const result = rules.parse({ value }, 'array')
    expect(result.check).toBe(false)
  })
})
