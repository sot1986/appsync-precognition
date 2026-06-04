import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'
import { baseErrors as errors } from '../src/utils'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe('test uniqueRule validation', () => {
  it.each([
    [[]],
    [[1, 2, 3]],
    [['a', 'b', 'c']],
  ])('validates unique elements', (value) => {
    const result = rules.parse({ value, errors }, 'unique')
    expect(result.check).toBe(true)
  })

  it.each([
    [[1, 2, 2]],
    [['a', 'b', 'a']],
    [[1, 1]],
    [['1', '1']],
    [[1, '1', 2]],
  ])('invalidates duplicate elements', (value) => {
    const result = rules.parse({ value, errors }, 'unique')
    expect(result.check).toBe(false)
  })

  it.each([
    'string',
    123,
    true,
    false,
    null,
    undefined,
    { key: 'value' },
  ])('invalidates non-array values', (value) => {
    const result = rules.parse({ value, errors }, 'unique')
    expect(result.check).toBe(false)
  })
})
