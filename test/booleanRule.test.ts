import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test booleanRule validation', () => {
  it.concurrent.each([
    true,
    false,
  ])('validates boolean values', (value) => {
    const result = rules.parse(value, 'boolean')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'true',
    'false',
    1,
    0,
    null,
    undefined,
    [],
    {},
    'string',
  ])('invalidates non-boolean values', (value) => {
    const result = rules.parse(value, 'boolean')
    expect(result.check).toBe(false)
  })
})
