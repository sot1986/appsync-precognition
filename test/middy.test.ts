import middy from '@middy/core'
import { describe, expect, it } from 'vitest'
import {
  AppSyncError,
  appsyncErrorHandler,
  precognition,
  PrecognitionValidationError,
  resolveLambdaResponseTemplate,
} from '../src/middy'

describe('middy Precognition Middleware', () => {
  const dummyValidator: any = (event: any) => {
    const data = event?.arguments ?? event?.body ?? event
    const errors: { path: string, message: string }[] = []

    if (!data?.email) {
      errors.push({ path: 'email', message: 'Email is required' })
    }
    if (data?.age && Number(data.age) < 18) {
      errors.push({ path: 'age', message: 'Age must be at least 18' })
    }

    if (errors.length > 0) {
      throw new PrecognitionValidationError('Validation failed', errors)
    }

    return data
  }

  const createHandler = () => {
    const baseHandler = async (event: any) => {
      return { message: 'Success', input: event.arguments ?? event.body ?? event }
    }

    return middy(baseHandler).use(precognition({ validator: dummyValidator }))
  }

  const mockContext: any = {}

  it('passes through normal valid requests', async () => {
    const handler = createHandler()
    const response = await handler({
      request: { headers: {} },
      arguments: { email: 'test@example.com', age: 20 },
    }, mockContext)

    expect(response).toEqual({ message: 'Success', input: { email: 'test@example.com', age: 20 } })
  })

  it('handles validation error during normal request via onError', async () => {
    const handler = createHandler()
    const response = await handler({
      request: { headers: {} },
      arguments: { age: 15 },
    }, mockContext)

    expect(response).toEqual({
      error: {
        type: 'AppSyncError',
        errors: [
          { message: 'Email is required', errorType: 'ValidationError', errorInfo: { path: 'email', value: undefined } },
          { message: 'Age must be at least 18', errorType: 'ValidationError', errorInfo: { path: 'age', value: undefined } },
        ],
        errorsCount: 2,
      },
    })
  })

  it('handles successful precognitive validation request (early data: null and response headers)', async () => {
    const handler = createHandler()
    const event: any = {
      request: {
        headers: {
          Precognition: 'true',
        },
      },
      arguments: { email: 'john@example.com', age: 25 },
    }
    const response = await handler(event, mockContext)

    expect(response).toEqual({ data: null })
    expect(event.response.headers.Precognition).toBe('true')
    expect(event.response.headers['Precognition-Success']).toBe('true')
  })

  it('handles failed precognitive validation request (returns AppSync error with precognition headers on event)', async () => {
    const handler = createHandler()
    const event: any = {
      request: {
        headers: {
          Precognition: 'true',
        },
      },
      arguments: { age: 10 },
    }
    const response = await handler(event, mockContext)

    expect(event.response.headers.Precognition).toBe('true')
    expect(response).toEqual({
      error: {
        type: 'AppSyncError',
        errors: [
          { message: 'Email is required', errorType: 'ValidationError', errorInfo: { path: 'email', value: undefined } },
          { message: 'Age must be at least 18', errorType: 'ValidationError', errorInfo: { path: 'age', value: undefined } },
        ],
        errorsCount: 2,
      },
    })
  })

  it('respects Precognition-Validate-Only header', async () => {
    const handler = createHandler()
    const event: any = {
      request: {
        headers: {
          'Precognition': 'true',
          'Precognition-Validate-Only': 'age',
        },
      },
      arguments: { email: 'valid@example.com', age: 25 },
    }
    const response = await handler(event, mockContext)

    expect(response).toEqual({ data: null })
    expect(event.response.headers.Precognition).toBe('true')
    expect(event.response.headers['Precognition-Success']).toBe('true')
    expect(event.response.headers['Precognition-Validate-Only']).toBe('age')
  })

  it('supports PrecognitionValidationError instantiated with array of errors per key', () => {
    const err = new PrecognitionValidationError('Invalid data', {
      'user.email': ['Email format invalid', 'Email domain not allowed'],
      'user.name': 'Name required',
    })

    expect(err.statusCode).toBe(422)
    expect(err.errors).toEqual([
      { path: 'user.email', message: 'Email format invalid' },
      { path: 'user.email', message: 'Email domain not allowed' },
      { path: 'user.name', message: 'Name required' },
    ])
  })

  it('supports PrecognitionValidationError instantiated with single string values in error map', () => {
    const err = new PrecognitionValidationError('Invalid data', {
      email: 'Email is required',
    })

    expect(err.errors).toEqual([
      { path: 'email', message: 'Email is required' },
    ])
  })

  it('supports passing validator function directly as shortcut argument', async () => {
    const event: any = {
      request: { headers: { Precognition: 'true' } },
      arguments: { email: 'direct@example.com', age: 20 },
    }
    const handler = middy(async () => ({ statusCode: 200, body: 'ok' }))
      .use(precognition(dummyValidator))

    const response = await handler(event, mockContext)

    expect(response).toEqual({ data: null })
  })

  describe('evaluate AppSync Resolver mode', () => {
    const appsyncEvent = {
      info: { fieldName: 'createUser', parentTypeName: 'Mutation' },
      arguments: { age: 12 },
      request: {
        headers: {
          precognition: 'true',
        },
      },
    }

    it('formats thrown validation error with errorType and errorInfo for AppSync', async () => {
      const handler = middy(async (event: any) => event.arguments)
        .use(precognition({ validator: dummyValidator }))

      const response = await handler(appsyncEvent, mockContext)

      expect(response).toEqual({
        error: {
          type: 'AppSyncError',
          errors: [
            { message: 'Email is required', errorType: 'ValidationError', errorInfo: { path: 'email', value: undefined } },
            { message: 'Age must be at least 18', errorType: 'ValidationError', errorInfo: { path: 'age', value: undefined } },
          ],
          errorsCount: 2,
        },
      })
    })

    it('supports custom toValidationErrors callback', async () => {
      class ThirdPartyCustomError extends Error {
        public details = [{ path: 'email', message: 'Email is invalid format' }]
      }

      const thirdPartyValidator = () => {
        throw new ThirdPartyCustomError('Validation failed in third party library')
      }

      const handler = middy(async (event: any) => event.arguments as any)
        .use(precognition<any, any>({
          validator: thirdPartyValidator,
          toValidationErrors: (err: Error) => {
            if (err instanceof ThirdPartyCustomError)
              return err.details

            return null
          },
        }))

      const response = await handler(appsyncEvent, mockContext)

      expect(response).toEqual({
        error: {
          type: 'AppSyncError',
          errors: [
            { message: 'Email is invalid format', errorType: 'ValidationError', errorInfo: { path: 'email', value: undefined } },
          ],
          errorsCount: 1,
        },
      })
    })
  })

  describe('appsyncErrorHandler middleware', () => {
    const appsyncEvent = {
      info: { fieldName: 'getItem', parentTypeName: 'Query' },
      arguments: {},
    }

    it('intercepts AppSyncError and turns it into a response object in AppSync mode', async () => {
      const handler = middy(async () => {
        throw new AppSyncError('Resource not found', 'NotFoundError', { id: '123' })
      }).use(appsyncErrorHandler())

      const res = await handler(appsyncEvent, mockContext)
      expect(res).toEqual({
        error: {
          type: 'AppSyncError',
          errors: [{ message: 'Resource not found', errorType: 'NotFoundError', errorInfo: { id: '123' } }],
          errorsCount: 1,
        },
      })
    })

    it('re-throws non-AppSync errors', async () => {
      const handler = middy(async () => {
        throw new Error('Standard system failure')
      }).use(appsyncErrorHandler())

      await expect(handler(appsyncEvent, mockContext)).rejects.toThrow('Standard system failure')
    })

    it('supports custom AppSyncMappedError implementing errorItems', async () => {
      class CustomMappedError extends Error {
        errorItems = [{ message: 'Custom mapped error', errorType: 'CustomType', errorInfo: null }]
      }

      const handler = middy(async () => {
        throw new CustomMappedError('Custom error message')
      }).use(appsyncErrorHandler())

      const res = await handler(appsyncEvent, mockContext)
      expect(res).toEqual({
        error: {
          type: 'AppSyncError',
          errors: [{ message: 'Custom mapped error', errorType: 'CustomType', errorInfo: null }],
          errorsCount: 1,
        },
      })
    })

    it('passes through successful executions without altering response', async () => {
      const handler = middy(async () => {
        return { data: 'success' }
      }).use(appsyncErrorHandler())

      const res = await handler(appsyncEvent, mockContext)
      expect(res).toEqual({ data: 'success' })
    })
  })

  describe('resolveLambdaResponseTemplate helper', () => {
    it('returns the expected VTL template string', () => {
      const template = resolveLambdaResponseTemplate()
      expect(template).toContain('$ctx.result.error.type == \'AppSyncError\'')
      expect(template).toContain('$util.appendError')
      expect(template).toContain('$util.toJson($ctx.result)')
    })
  })
})
