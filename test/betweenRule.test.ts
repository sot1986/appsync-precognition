import { describe, expect, it } from 'vitest'
import * as rules from '../src/rules'

describe.concurrent('test betweenRule validation', () => {
  it.concurrent.each([
    'aa',
    'abc',
    'abcd',
    'abcde',
  ])('validates between length string', (value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'aa',
    'abc',
    'abcd',
    'abcde',
  ])('validates between length string in full form', (value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'a',
    'abcdef',
    null,
  ])('invalidates between length string', (value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(false)
  })

  // apply test for array input value
  it.concurrent.each([
    [1, 2] as unknown[],
    [1, 2, 3] as unknown[],
    [1, 2, 3, 4, 5] as unknown[],
  ])('validates between length array', (...value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [1] as unknown[],
    [1, 2, 3, 4, 5, 6] as unknown[],
    [null],
  ])('invalidates between length array', (...value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(false)
  })

  // apply test for number input value
  it.concurrent.each([
    2,
    3,
    4,
    5,
    2.5,
  ])('validates between number', (value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    1,
    6,
    0,
    -1,
  ])('invalidates between number', (value) => {
    const result = rules.parse(value, ['between', 2, 5])
    expect(result.check).toBe(false)
  })
})
