import type { Ctx } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { assertValidated, precognitiveValidation } from '../src/index'
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
    const ctx: Ctx<{ name: string, age: number }> = {
      request: { headers: {} },
      args: { name: 'Marco', age: 25 },
      stash: {},
    }

    const result = precognitiveValidation(ctx, {
      name: ['required'],
      age: ['required', ['min', 18]],
    })

    expect(result).toEqual({ name: 'Marco', age: 25 })
  })

  it('validates all fields and early returns when precognitive without validate-only header', () => {
    const ctx: Ctx<{ name: string, age: number }> = {
      request: { headers: { precognition: 'true' } },
      args: { name: 'Marco', age: 25 },
      stash: {},
    }

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
    const ctx: Ctx<{ name: string, age: number, email: string }> = {
      request: {
        headers: {
          'precognition': 'true',
          'precognition-validate-only': 'name,age',
        },
      },
      args: { name: 'Marco', age: 25, email: 'invalid' },
      stash: {},
    }

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
        email: ['required', 'email'], // This won't be validated
      })
    }).toThrow('Early return')
  })

  it('throws validation error for invalid precognitive fields', () => {
    const ctx: Ctx<{ name: string, age: number, email?: string | null }> = {
      request: {
        headers: {
          'precognition': 'true',
          'precognition-validate-only': 'name',
        },
      },
      args: { name: '', age: 25 },
      stash: {},
    }

    expect(() => {
      precognitiveValidation(ctx, {
        name: ['required'],
        age: ['required', ['min', 18]],
      })
    }).toThrow(AppsyncError)
  })
})
