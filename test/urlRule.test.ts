import { describe, expect, it, vi } from 'vitest'
import * as rules from '../src/rules'
import { url } from '../src/utils'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test urlRule validation', () => {
  it.concurrent.each([
    'https://example.com',
    'http://domain.org',
    'https://www.company.co.uk',
    'http://test-domain.com',
    'https://api.service.com/path',
    'https://site.com/path?query=value',
    'http://localhost:3000',
  ])('validates valid url', (value) => {
    const result = rules.parse(value, ['regex', url])
    expect(result.check).toBe(true)
  })

  it.concurrent.each([
    'invalid-url',
    'ftp://domain.com',
    'example.com',
    'http://',
    'https://',
    'http://.',
    'http://.com',
    '',
    null,
  ])('invalidates invalid url', (value) => {
    const result = rules.parse(value, ['regex', url])
    expect(result.check).toBe(false)
  })

  // test non-string values
  it.concurrent.each([
    123,
    [],
    {},
    true,
  ])('invalidates non-string values', (value) => {
    const result = rules.parse(value, ['regex', url])
    expect(result.check).toBe(false)
  })
})
