import { describe, expect, it, vi } from 'vitest'
import { precognitiveValidation } from '../src/index'
import { AppsyncError, EarlyReturnError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil, mockRuntime } = await import('./mocks')
  return {
    util: mockUtil(),
    runtime: mockRuntime(),
  }
})

describe.concurrent('test precognitiveValidation function', () => {
  it('returns validate result when not precognitive request', () => {
    const ctx = {
      request: { headers: {} },
      args: { name: 'Marco', age: 25 },
    } as any

    const result = precognitiveValidation(ctx, {
      name: ['required'],
      age: ['required', ['min', 18]],
    })

    expect(result).toEqual({ name: 'Marco', age: 25 })
  })

  it('validates all fields and early returns when precognitive without validate-only header', () => {
    const ctx = {
      request: { headers: { precognition: 'true' } },
      args: { name: 'Marco', age: 25 },
    } as any

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
      })
    }).toThrow(new EarlyReturnError('Early return'))
  })

  it('validates only specified fields when precognitive with validate-only header', () => {
    const ctx = {
      request: {
        headers: {
          'precognition': 'true',
          'precognition-validate-only': 'name,age',
        },
      },
      args: { name: 'Marco', age: 25, email: 'invalid' },
    } as any

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
        email: ['required', 'email'], // This won't be validated
      })
    }).toThrow('Early return')
  })

  it('throws validation error for invalid precognitive fields', () => {
    const ctx = {
      request: {
        headers: {
          'precognition': 'true',
          'precognition-validate-only': 'name',
        },
      },
      args: { name: '', age: 25 },
    } as any

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
      })
    }).toThrow(AppsyncError)
  })
})
