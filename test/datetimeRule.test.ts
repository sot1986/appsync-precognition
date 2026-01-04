import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'
import { datetime, integer } from '../src/utils'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test dateRule validation', () => {
  it.concurrent.each([
    '2023-12-31T23:59:59.123Z',
    '2024-01-01T00:00:00.000Z',
    '2023-06-15T12:30:45.999Z',
    '2022-02-28T08:15:30.123456Z', // microseconds
    '1970-01-01T00:00:00.000Z',
  ])('validates valid ISO date string', (value) => {
    const result = rules.parse(value, ['regex', datetime])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'invalid-date',
    '2023-12-31', // no time
    '2023-12-31T23:59:59', // no milliseconds/Z
    '2023-12-31T23:59:59.1234567Z', // too many millisecond digits
    '2023/12/31T23:59:59.123Z', // wrong date separator
    '2023-13-31T23:59:59.123Z', // invalid month
    '2023-12-32T23:59:59.123Z', // invalid day
    '2023-12-31T25:59:59.123Z', // invalid hour
    '',
    null,
  ])('invalidates invalid date string', (value) => {
    const result = rules.parse(value, ['regex', datetime])
    expect(result.check).toBe(false)
  })

  // test number values (timestamps - should be valid)
  it.concurrent.each([
    1640995199123, // timestamp
    0, // epoch
    Date.now(), // current timestamp
  ])('validates number timestamps', (value) => {
    const result = rules.parse(String(value), ['regex', datetime, integer])
    expect(result.check).toBe(true)
  })
})
