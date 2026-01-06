import { describe, expect, it } from 'vitest'
import * as rules from '../src/rules'
import { baseErrors as errors } from '../src/utils'

describe('test maxRule validation', () => {
  it.concurrent.each([
    '',
    'a',
    'a'.repeat(10),
  ])('validates max length string', (value) => {
    const result = rules.parse({ value, errors }, ['max', 10])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    [] as unknown[],
    ['a', 'b'],
    ['a', null, 3, 4],
  ])('validates max array length', (...value) => {
    const result = rules.parse({ value, errors }, ['max', 4])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    1,
    5,
    0,
  ])('validates max number', (value) => {
    const result = rules.parse({ value, errors }, ['max', 5])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    10,
    100,
    9.0000001,
  ])('invalidates max number', (value) => {
    const result = rules.parse({ value, errors }, ['max', 9])
    expect(result.check).toBe(false)
  })

  it.concurrent.each([
    'a'.repeat(11),
    'a'.repeat(100),
  ])('invalidates max length string', (value) => {
    const result = rules.parse({ value, errors }, ['max', 10])
    expect(result.check).toBe(false)
  })

  it.concurrent.each([
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    ['a', 'b', null, 'd', 'e', 'f', 'g'],
  ])('invalidates max array length', (...value) => {
    const result = rules.parse({ value, errors }, ['max', 4])
    expect(result.check).toBe(false)
  })
})
