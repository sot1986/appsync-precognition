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

describe.concurrent('test requiredRule validation', () => {
  it.concurrent.each([
    'hello',
    'a',
    'test string',
    '0',
    ' ',
  ])('validates non-empty string', (value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    '',
  ])('invalidates empty string', (value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(false)
  })

  // test array values
  it.concurrent.each([
    [1],
    [1, 2, 3],
    ['a', 'b'],
  ])('validates non-empty array', (...value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [] as unknown[],
  ])('invalidates empty array', (...value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(false)
  })

  // test number values (always valid)
  it.concurrent.each([
    0,
    1,
    -1,
    3.14,
    -5.5,
  ])('validates any number', (value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(true)
  })

  // test other value types
  it.concurrent.each([
    null,
    undefined,
  ])('invalidates other value types', (value) => {
    const result = rules.parse({ value, errors }, 'required')
    expect(result.check).toBe(false)
  })
})
