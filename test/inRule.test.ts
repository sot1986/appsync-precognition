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

describe.concurrent('test inRule validation', () => {
  it.concurrent.each([
    ['apple', 'apple,banana,orange'],
    ['banana', 'apple,banana,orange'],
    ['orange', 'apple,banana,orange'],
    ['red', 'red,green,blue'],
    ['active', 'active,inactive,pending'],
  ])('validates string in allowed values', (value, allowedValues) => {
    const result = rules.parse({ value, errors }, ['in', ...allowedValues.split(',')])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    ['grape', 'apple,banana,orange'],
    ['yellow', 'red,green,blue'],
    ['deleted', 'active,inactive,pending'],
    ['', 'apple,banana,orange'],
  ])('invalidates string not in allowed values', (value, allowedValues) => {
    const result = rules.parse({ value, errors }, ['in', ...allowedValues])
    expect(result.check).toBe(false)
  })

  // test number values
  it.concurrent.each([
    [1, 1, 2, 3],
    [2, 1, 2, 3],
    [10, 10, 20, 30],
  ])('validates number in allowed values', (value, ...allowedValues) => {
    const result = rules.parse({ value, errors }, ['in', ...allowedValues])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [4, 1, 2, 3],
    [0, 1, 2, 3],
    [15, 10, 20, 30],
  ])('invalidates number not in allowed values', (value, ...allowedValues) => {
    const result = rules.parse({ value, errors }, ['in', ...allowedValues])
    expect(result.check).toBe(false)
  })

  // test other value types (should fail)
  it.concurrent.each([
    [[], 'apple,banana,orange'],
    [{}, 'apple,banana,orange'],
    [true, 'apple,banana,orange'],
    [null, 'apple,banana,orange'],
  ])('invalidates non-string/non-number values', (value, allowedValues) => {
    const result = rules.parse({ value, errors }, ['in', ...allowedValues])
    expect(result.check).toBe(false)
  })
})
