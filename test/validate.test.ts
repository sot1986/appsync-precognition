import { describe, expect, it, vi } from 'vitest'
import { validate } from '../src/index'
import { AppsyncError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test validate function', () => {
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
      'phone': ['sometimes', ['regex', '^\+39\d+$']],
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
        'phone': ['required', ['regex', '^\+39\d+$']],
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
})
