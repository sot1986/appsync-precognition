import { describe, expect, it } from 'vitest'
import * as rules from '../src/rules'

describe('test maxRule validation', () => {
  it.each([
    '',
    'a',
    'a'.repeat(10),
  ])('validates max lenght string', (value) => {
    const result = rules.parse(value, 'max:10')
    expect(result.check).toBe(true)
  })
})
