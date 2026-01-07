import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validate } from '../src/index'
import { baseErrors, email } from '../src/utils'
import { AppsyncError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe('test validate function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    {
      name: 'Marco',
      age: 25,
      address: {
        address: 'Via Roma',
        cap: '00015',
      },
      job: 'employee',
      phone: undefined,
    },
  ])('pass with valid objects', (data) => {
    const result = validate(data, {
      'name': ['required', ['min', 3]],
      'age': ['required', ['min', 18]],
      'address.address': ['required'],
      'address.cap': ['required', ['between', 2, 10]],
      'phone': ['sometimes', ['regex', '^\\+39\\d+$']],
    })
    expect(result).toEqual(data)
  })

  it.each([
    {
      name: 'Marco',
      age: 25,
      address: {
        address: 'Via Roma',
        cap: '00015',
      },
      job: 'employee',
      phone: undefined,
    },
  ])('fails with invalid objects, tracking each errors', (data) => {
    try {
      validate(data, {
        'name': ['required', ['min', 3]],
        'age': ['required', ['min', 18]],
        'address.address': ['required'],
        'address.cap': ['required', ['between', 2, 10]],
        'phone': ['required', ['regex', '^\\+39\\d+$']],
      })
      expect(true).toBe(false)
    }
    catch (error) {
      expect(error).toBeInstanceOf(AppsyncError)
      if (!(error instanceof AppsyncError)) {
        throw new Error('This should not happen')
      }
      expect(error.message).toBe('phone is required')
      expect(error.errors).toHaveLength(1)
      expect(error.errors[0].msg).toBe('phone is required')
      expect(error.errors[0].errorType).toBe('ValidationError')
      expect(error.errors[0].data).toBe(null)
      expect(error.errors[0].errorInfo).toMatchObject({
        path: 'phone',
        value: undefined,
      })
    }
  })

  it.each([
    {
      name: 'Marco',
      age: 25,
      phone: null,
      email: 'marco@example.com',
    },
  ])('passes with nullable field set to null', (data) => {
    const result = validate(data, {
      name: ['required'],
      age: ['required'],
      phone: ['nullable', ['regex', '^\\+39\\d+$']], // nullable allows null
      email: ['required', ['regex', email]],
    })
    expect(result).toEqual(data)
  })

  it.each([
    {
      name: 'Marco',
      age: 25,
      phone: '+393331234567',
      email: 'marco@example.com',
    },
  ])('passes with nullable field having valid value', (data) => {
    const result = validate(data, {
      name: ['required'],
      age: ['required'],
      phone: ['required', 'string', 'phone'], // nullable allows valid values
      email: ['nullable', 'string', 'email'],
    })
    expect(result).toEqual(data)
  })

  it.each([
    {
      name: 'Marco',
      age: 25,
      phone: 'invalid-phone',
      email: 'marco@example.com',
    },
  ])('fails with nullable field having invalid value', (data) => {
    try {
      validate(data, {
        name: ['required'],
        age: ['required'],
        phone: ['nullable', 'phone'], // nullable but invalid format
        email: ['required', 'email'],
      })
      expect(true).toBe(false)
    }
    catch (error) {
      expect(error).toBeInstanceOf(AppsyncError)
      if (!(error instanceof AppsyncError)) {
        throw new Error('This should not happen')
      }
      expect(error.message).toBe(baseErrors.phone.replace(':attr', 'phone'))
    }
  })

  it.each([
    {
      name: 'Marco',
      hobbies: [null, 'hiking'] as unknown[] as string[],
    },
  ])('removes the index from array values error\' messages', (data) => {
    try {
      validate<{ name: string, hobbies: string[] }>(data, {
        'name': ['required'],
        'hobbies': ['required', 'array', ['min', 1]],
        'hobbies.*': ['required', 'string', ['max', 50]],
      })
      expect(false).toBe(true)
    }
    catch (error) {
      expect(error).toBeInstanceOf(AppsyncError)
      if (!(error instanceof AppsyncError)) {
        throw new Error('This should not happen')
      }
      expect(error.message).toBe('hobbies is required')
      expect(error.errors).toHaveLength(1)
    }
  })

  it.each([
    'your phone',
  ])('handles custom attribute names', (name) => {
    try {
      validate({ phone: 'invalid-phone', name: 'Marco' }, {
        phone: ['required', { rule: 'phone' }],
      }, { attributes: { ':phone': name } })
      expect(false).toBe(true)
    }
    catch (error) {
      expect(error).toBeInstanceOf(AppsyncError)
      if (!(error instanceof AppsyncError)) {
        throw new Error('This should not happen')
      }
      expect(error.message).toBe(baseErrors.phone.replace(':attr', name))
    }
  })
})
