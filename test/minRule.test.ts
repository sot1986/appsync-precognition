import { describe, expect, it } from 'vitest'
import * as rules from '../src/rules'

describe('test minRule validation', () => {
  it.each([
    'aa',
    'a'.repeat(10),
    'a'.repeat(500),
  ])('validates min lenght string', (value) => {
    const result = rules.validate(value, 'min:2')
    expect(result.check).toBe(true)
  })
})
