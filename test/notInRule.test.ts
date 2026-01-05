import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test notInRule validation', () => {
  it.concurrent.each([
    ['grape', 'apple,banana,orange'],
    ['yellow', 'red,green,blue'],
    ['deleted', 'active,inactive,pending'],
    ['', 'apple,banana,orange'],
  ])('validates string not in forbidden values', (value, forbiddenValues) => {
    const result = rules.parse({ value }, ['notIn', ...forbiddenValues.split(',')])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    ['apple', 'apple,banana,orange'],
    ['banana', 'apple,banana,orange'],
    ['red', 'red,green,blue'],
    ['active', 'active,inactive,pending'],
  ])('invalidates string in forbidden values', (value, forbiddenValues) => {
    const result = rules.parse({ value }, ['notIn', ...forbiddenValues.split(',')])
    expect(result.check).toBe(false)
  })

  // test number values
  it.concurrent.each([
    [11, 1, 2, 3],
    [25, 1, 2, 3],
    [100, 10, 20, 30],
  ])('validates number not in forbidden values', (value, ...forbiddenValues) => {
    const result = rules.parse({ value }, ['notIn', ...forbiddenValues])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [1, 1, 2, 3],
    [2, 1, 2, 3],
    [10, 10, 20, 30],
  ])('invalidates number in forbidden values', (value, ...forbiddenValues) => {
    const result = rules.parse({ value }, ['notIn', ...forbiddenValues])
    expect(result.check).toBe(false)
  })

  // test other value types (should fail)
  it.concurrent.each([
    [[], 'apple,banana,orange'],
    [{}, 'apple,banana,orange'],
    [true, 'apple,banana,orange'],
    [null, 'apple,banana,orange'],
  ])('accept non-string/non-number values', (value, forbiddenValues) => {
    const result = rules.parse({ value }, ['notIn', ...forbiddenValues.split(',')])
    expect(result.check).toBe(true)
  })
})
