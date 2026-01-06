import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'
import { baseErrors as errors, uuid } from '../src/utils'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test uuidRule validation', () => {
  it.concurrent.each([
    '123e4567-e89b-12d3-a456-426614174000',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    '00000000-0000-1000-8000-000000000000',
    'b68ef280-70a1-7063-9875-c341eeec7f04', // uuid v7
    '123e4567-e89b-12d3-c456-426614174000', // variant (c)
  ])('validates valid uuid', (value) => {
    const result = rules.parse({ value, errors }, ['regex', uuid])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'invalid-uuid',
    '123e4567-e89b-12d3-a456-42661417400', // too short
    '123e4567-e89b-12d3-a456-4266141740000', // too long
    '123e4567-e89b-12d3-a456-42661417400g', // invalid character
    '123e4567e89b12d3a456426614174000', // no hyphens
    '123e4567-e89b-12d3-a456', // incomplete
    '',
    null,
  ])('invalidates invalid uuid', (value) => {
    const result = rules.parse({ value, errors }, ['regex', uuid])
    expect(result.check).toBe(false)
  })

  // test non-string values
  it.concurrent.each([
    123,
    [],
    {},
    true,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse({ value, errors }, ['regex', uuid])
    expect(result.check).toBe(false)
  })
})
