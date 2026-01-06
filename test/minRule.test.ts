import { describe, expect, it } from 'vitest'
import * as rules from '../src/rules'
import { baseErrors as errors } from '../src/utils'

describe.concurrent('test minRule validation', () => {
  it.concurrent.each([
    'aa',
    'a'.repeat(10),
    'a'.repeat(500),
  ])('validates min length string', (value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(true)
  })

  // apply similar testing as done in test/maxRule.test.ts
  it.concurrent.each([
    'a',
    null,
  ])('invalidates min length string', (value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(false)
  })

  // apply test for array input value
  it.concurrent.each([
    [1, 2, 3] as unknown[],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as unknown[],
  ])('validates min length array', (...value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [1] as unknown[],
    [null],
  ])('invalidates min length array', (...value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(false)
  })

  // apply test for number input value
  it.concurrent.each([
    2,
    2.0,
  ])('validates min number', (value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    1,
    0,
    -5,
  ])('invalidates min length number', (value) => {
    const result = rules.parse({ value, errors }, ['min', 2])
    expect(result.check).toBe(false)
  })
})
