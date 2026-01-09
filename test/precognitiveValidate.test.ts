import type { Context } from '@aws-appsync/utils'
import { describe, expect, it, vi } from 'vitest'
import { assertValidated, precognitiveValidation } from '../src/index'
import { AppsyncError, EarlyReturnError, mockContext } from './mocks'

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
    const ctx = mockContext({ args: { name: 'Marco', age: 25 } })

    const result = precognitiveValidation(ctx, {
      name: ['required'],
      age: ['required', ['min', 18]],
    })

    expect(result).toEqual({ name: 'Marco', age: 25 })
  })

  it('validates all fields and early returns when precognitive without validate-only header', () => {
    const ctx = mockContext({
      args: { name: 'Marco', age: 25 },
      request: { headers: { precognition: 'true' } },
    })

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
      })
    }).toThrow(new EarlyReturnError('Early return'))

    assertValidated(ctx)
    expect(ctx.stash.__validated).toEqual({ name: 'Marco', age: 25 })
  })

  it('validates only specified fields when precognitive with validate-only header', () => {
    const ctx = mockContext<{ name: string, age: number, email: string }>({
      args: { name: 'Marco', age: 25, email: 'invalid' },
      request: {
        headers: {
          'precognition': 'true',
          'precognition-validate-only': 'name,age',
        },
      },
    })

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
      stash: {},
    } as unknown as Context<{ name: string, age: number, email?: string | null }>

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],

      })
    }).toThrow(AppsyncError)
  })
})
