import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: {
      ...mockUtil(),
    },
  }
})

describe.concurrent('test beforeRule validation', () => {
  it.concurrent.each([
    ['2023-01-01T00:00:00.000Z', '2023-12-31T23:59:59.999Z'], // before end of year
    ['2023-06-15T12:00:00.000Z', '2023-06-15T12:00:01.000Z'], // 1 second before
    ['2022-12-31T23:59:59.999Z', '2023-01-01T00:00:00.000Z'], // before new year
  ])('validates date string before target', (value, target) => {
    const result = rules.parse({ value }, ['before', target])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    ['2023-12-31T23:59:59.999Z', '2023-01-01T00:00:00.000Z'], // after target
    ['2023-06-15T12:00:01.000Z', '2023-06-15T12:00:00.000Z'], // 1 second after
    ['2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z'], // same time (not before)
  ])('invalidates date string not before target', (value, target) => {
    const result = rules.parse({ value }, ['before', target])
    expect(result.check).toBe(false)
  })

  // test number values (timestamps)
  it.concurrent.each([
    [1640995199000, '2023-01-01T00:00:00.000Z'], // timestamp before 2023
    [0, '1970-01-01T00:00:01.000Z'], // epoch before 1 second later
  ])('validates number timestamp before target', (value, target) => {
    const result = rules.parse({ value }, ['before', target])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [1672531200000, '2023-01-01T00:00:00.000Z'], // timestamp after target
    [1672531200000, '2023-01-01T00:00:00.000Z'], // same timestamp (not before)
  ])('invalidates number timestamp not before target', (value, target) => {
    const result = rules.parse({ value }, ['before', target])
    expect(result.check).toBe(false)
  })

  // test other value types (should fail)
  it.concurrent.each([
    [[], '2023-01-01T00:00:00.000Z'],
    [{}, '2023-01-01T00:00:00.000Z'],
    [true, '2023-01-01T00:00:00.000Z'],
    [null, '2023-01-01T00:00:00.000Z'],
  ])('invalidates non-string/non-number values', (value, target) => {
    const result = rules.parse({ value }, ['before', target])
    expect(result.check).toBe(false)
  })
})
