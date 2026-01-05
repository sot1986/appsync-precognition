import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test nullableRule validation', () => {
  it.concurrent.each([
    null,
    undefined,
    'string',
    123,
    true,
    false,
    [],
    {},
  ])('validates all values as nullable', (value) => {
    const result = rules.parse({ value }, 'nullable')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [null, true],
    [undefined, true],
    ['string', false],
    [123, false],
    [true, false],
    [[], false],
    [{}, false],
  ])('sets skipNext correctly based on value type', (value, expectedSkipNext) => {
    const result = rules.parse({ value }, 'nullable')
    expect(result.skipNext).toBe(expectedSkipNext)
  })
})
