import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test afterOrEqualRule validation', () => {
  it.concurrent.each([
    ['2023-12-31T23:59:59.999Z', '2023-01-01T00:00:00.000Z'], // after start of year
    ['2023-06-15T12:00:01.000Z', '2023-06-15T12:00:00.000Z'], // 1 second after
    ['2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z'], // same time (equal)
    ['2023-01-01T00:00:00.001Z', '2023-01-01T00:00:00.000Z'], // 1 millisecond after
  ])('validates date string after or equal to target', (value, target) => {
    const result = rules.parse({ value }, ['afterOrEqual', target])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    ['2023-01-01T00:00:00.000Z', '2023-12-31T23:59:59.999Z'], // before target
    ['2023-06-15T12:00:00.000Z', '2023-06-15T12:00:01.000Z'], // 1 second before
    ['2022-12-31T23:59:59.999Z', '2023-01-01T00:00:00.000Z'], // before new year
  ])('invalidates date string before target', (value, target) => {
    const result = rules.parse({ value }, ['afterOrEqual', target])
    expect(result.check).toBe(false)
  })

  // test number values (timestamps)
  it.concurrent.each([
    [1672531201000, '2023-01-01T00:00:00.000Z'], // timestamp after 2023 start
    [1000, '1970-01-01T00:00:00.000Z'], // 1 second after epoch
    [1672531200000, '2023-01-01T00:00:00.000Z'], // same timestamp (equal)
  ])('validates number timestamp after or equal to target', (value, target) => {
    const result = rules.parse({ value }, ['afterOrEqual', target])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [1640995199000, '2023-01-01T00:00:00.000Z'], // timestamp before target
    [0, '1970-01-01T00:00:01.000Z'], // epoch before 1 second later
  ])('invalidates number timestamp before target', (value, target) => {
    const result = rules.parse({ value }, ['afterOrEqual', target])
    expect(result.check).toBe(false)
  })

  // test other value types (should fail)
  it.concurrent.each([
    [[], '2023-01-01T00:00:00.000Z'],
    [{}, '2023-01-01T00:00:00.000Z'],
    [true, '2023-01-01T00:00:00.000Z'],
    [null, '2023-01-01T00:00:00.000Z'],
  ])('invalidates non-string/non-number values', (value, target) => {
    const result = rules.parse({ value }, ['afterOrEqual', target])
    expect(result.check).toBe(false)
  })
})
