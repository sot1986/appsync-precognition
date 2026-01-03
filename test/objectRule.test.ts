import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test objectRule validation', () => {
  it.concurrent.each([
    {},
    { key: 'value' },
    { name: 'John', age: 30 },
    { nested: { prop: 'value' } },
    null, // null is an object in JavaScript
  ])('validates object values', (value) => {
    const result = rules.parse(value, 'object')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [],
    [1, 2, 3],
    'string',
    123,
    true,
    false,
    undefined,
  ])('invalidates non-object values', (value) => {
    const result = rules.parse(value, 'object')
    expect(result.check).toBe(false)
  })
})
