import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appendValidationError, validationError } from '../src/index'
import { AppsyncError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
    runtime: {
      earlyReturn: vi.fn(),
    },
  }
})

describe('test validation helper functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validationError', () => {
    it('throws an AppsyncError with the correct message and type', () => {
      try {
        validationError('Custom error message')
        expect(true).toBe(false) // Should not reach here
      }
      catch (error) {
        expect(error).toBeInstanceOf(AppsyncError)
        if (error instanceof AppsyncError) {
          expect(error.message).toBe('Custom error message')
          expect(error.errors[0].errorType).toBe('ValidationError')
        }
      }
    })

    it('includes path and value in errorInfo when provided', () => {
      try {
        /** @ts-expect-error - testing incorrect path usage */
        validationError('Invalid field', { path: 'user.email', value: 'invalid-email' })
        expect(true).toBe(false)
      }
      catch (error) {
        if (error instanceof AppsyncError) {
          expect(error.errors[0].errorInfo).toEqual({
            path: 'user.email',
            value: 'invalid-email',
          })
        }
      }
    })

    it('works with type-safe paths', () => {
      interface User {
        profile: { name: string }
      }
      try {
        validationError<User>('Name too short', { path: 'profile.name' })
        expect(true).toBe(false)
      }
      catch (error) {
        if (error instanceof AppsyncError) {
          expect(error.errors[0].errorInfo.path).toBe('profile.name')
        }
      }
    })

    it('allows bypassing type safety when no generic is provided', () => {
      try {
        validationError('Random path', { path: 'some.untyped.path' })
        expect(true).toBe(false)
      }
      catch (error) {
        if (error instanceof AppsyncError) {
          expect(error.errors[0].errorInfo.path).toBe('some.untyped.path')
        }
      }
    })
  })

  describe('appendValidationError', () => {
    it('appends an error without throwing immediately', () => {
      // In our mock, appendError just pushes to a local array.
      // To verify it, we can call validationError afterwards which throws everything.

      appendValidationError('First error', { path: 'field1' })
      appendValidationError('Second error', { path: 'field2' })

      try {
        validationError('Final error')
        expect(true).toBe(false)
      }
      catch (error) {
        if (error instanceof AppsyncError) {
          expect(error.errors).toHaveLength(3)
          expect(error.errors[0].msg).toBe('First error')
          expect(error.errors[1].msg).toBe('Second error')
          expect(error.errors[2].msg).toBe('Final error')
        }
      }
    })
  })
})
