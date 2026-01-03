import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test numberRule validation', () => {
  it.concurrent.each([
    0,
    1,
    -1,
    3.14,
    -5.5,
    123,
    0.1,
    Number.MAX_VALUE,
    Number.MIN_VALUE,
  ])('validates number values', (value) => {
    const result = rules.parse(value, 'number')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    '123',
    'hello',
    true,
    false,
    null,
    undefined,
    [],
    {},
  ])('invalidates non-number values', (value) => {
    const result = rules.parse(value, 'number')
    expect(result.check).toBe(false)
  })
})
