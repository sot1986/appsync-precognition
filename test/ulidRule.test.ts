import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test ulidRule validation', () => {
  it.concurrent.each([
    '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    '01BX5ZZKBKACTAV9WEVGEMMVRZ',
    '01CQRX9J5V9XKQRX9J5V9XKQRX',
    '7ZZZZZZZZZZZZZZZZZZZZZZZZZ',
    '00000000000000000000000000',
  ])('validates valid ulid', (value) => {
    const result = rules.parse(value, 'ulid')
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'invalid-ulid',
    '01ARZ3NDEKTSV4RRFFQ69G5FA', // too short (25 chars)
    '01ARZ3NDEKTSV4RRFFQ69G5FAVV', // too long (27 chars)
    '01ARZ3NDEKTSV4RRFFQ69G5FIV', // contains 'I' (invalid)
    '01ARZ3NDEKTSV4RRFFQ69G5FLV', // contains 'L' (invalid)
    '01ARZ3NDEKTSV4RRFFQ69G5FOV', // contains 'O' (invalid)
    '01ARZ3NDEKTSV4RRFFQ69G5FUV', // contains 'U' (invalid)
    '01arz3ndektsv4rrffq69g5fav', // lowercase (invalid)
    '',
    null,
  ])('invalidates invalid ulid', (value) => {
    const result = rules.parse(value, 'ulid')
    expect(result.check).toBe(false)
  })

  // test non-string values
  it.concurrent.each([
    123,
    [],
    {},
    true,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse(value, 'ulid')
    expect(result.check).toBe(false)
  })
})
