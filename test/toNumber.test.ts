import { describe, expect, it, vi } from 'vitest'
import { toNumber } from '../src/utils'
import { AppsyncError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test toNumber utility', () => {
  it.concurrent.each([
    ['123', 123],
    ['0', 0],
    ['3.14', 3.14],
    ['0.5', 0.5],
    ['-123', -123], // Note: function uses -value for negative strings
    ['-3.14', -3.14],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['+5', 5],
  ])('converts valid number strings', (input, expected) => {
    const result = toNumber(input)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    'abc',
    'not-a-number',
    '',
    '12.34.56',
    'NaN',
  ])('throws error for invalid number strings', (input) => {
    expect(() => {
      toNumber(input)
    }).toThrow(AppsyncError)
  })
})
