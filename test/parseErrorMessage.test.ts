import { describe, expect, it } from 'vitest'
import { parseErrorMessage } from '../src/utils'

describe.concurrent('test parseErrorMessage utility', () => {
  it.concurrent.each([
    ['Hello :name', { ':name': 'John' }, 'Hello John'],
    [':attr is required', { ':attr': 'email' }, 'email is required'],
    [':attr must be at least :min characters', { ':attr': 'password', ':min': '8' }, 'password must be at least 8 characters'],
    [':attr must be between :min and :max', { ':attr': 'age', ':min': '18', ':max': '65' }, 'age must be between 18 and 65'],
  ])('replaces parameters in message', (message, params, expected) => {
    const result = parseErrorMessage(message, params)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['Hello :name :name', { ':name': 'John' }, 'Hello John John'],
    [':attr :attr :attr', { ':attr': 'field' }, 'field field field'],
  ])('replaces multiple occurrences of same parameter', (message, params, expected) => {
    const result = parseErrorMessage(message, params)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['No parameters here', undefined, 'No parameters here'],
    ['No parameters here', {}, 'No parameters here'],
    ['Hello :name', {}, 'Hello :name'],
  ])('handles messages without parameters', (message, params, expected) => {
    const result = parseErrorMessage(message, params)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['', {}, ''],
    ['', { ':name': 'John' }, ''],
    [':name', { ':name': '' }, ''],
  ])('handles edge cases', (message, params, expected) => {
    const result = parseErrorMessage(message, params)
    expect(result).toBe(expected)
  })
})
