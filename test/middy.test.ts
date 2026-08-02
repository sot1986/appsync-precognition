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
    const data = event?.body
      ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body)
      : (event?.arguments ?? event)
    const errors: Record<string, string[]> = {}

    if (!data?.email) {
      errors.email = ['Email is required']
    }
    if (data?.age && Number(data.age) < 18) {
      errors.age = ['Age must be at least 18']
    }

    if (Object.keys(errors).length > 0) {
      throw new PrecognitionValidationError('Validation failed', errors)
    }

    return data
  }

  const createHandler = () => {
    const baseHandler = async (event: any) => {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success', input: event.body }),
      }
    }

    return middy(baseHandler).use(precognition({ validator: dummyValidator }))
  }

  const mockContext: any = {}

  it('passes through normal valid requests', async () => {
    const handler = createHandler()
    const response = await handler({
      headers: {},
      body: { email: 'test@example.com', age: 20 },
    }, mockContext)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).message).toBe('Success')
  })

  it('handles validation error during normal request via onError', async () => {
    const handler = createHandler()
    const response = await handler({
      headers: {},
      body: { age: 15 },
    }, mockContext)

    expect(response.statusCode).toBe(422)
    const body = JSON.parse(response.body)
    expect(body.message).toBe('Validation failed')
    expect(body.errors.email).toEqual(['Email is required'])
  })

  it('handles successful precognitive validation request (early 204)', async () => {
    const handler = createHandler()
    const response = await handler({
      headers: {
        Precognition: 'true',
      },
      body: { email: 'john@example.com', age: 25 },
    }, mockContext)

    expect(response.statusCode).toBe(204)
    expect(response.headers.Precognition).toBe('true')
    expect(response.headers['Precognition-Success']).toBe('true')
  })

  it('handles failed precognitive validation request (returns 422 with precognition headers)', async () => {
    const handler = createHandler()
    const response = await handler({
      headers: {
        Precognition: 'true',
      },
      body: { age: 10 },
    }, mockContext)

    expect(response.statusCode).toBe(422)
    expect(response.headers.Precognition).toBe('true')
    const body = JSON.parse(response.body)
    expect(body.errors.email).toEqual(['Email is required'])
  })

  it('respects Precognition-Validate-Only header', async () => {
    const handler = createHandler()
    const response = await handler({
      headers: {
        'Precognition': 'true',
        'Precognition-Validate-Only': 'age',
      },
      body: { age: 25 },
    }, mockContext)

    expect(response.statusCode).toBe(204)
    expect(response.headers.Precognition).toBe('true')
    expect(response.headers['Precognition-Success']).toBe('true')
    expect(response.headers['Precognition-Validate-Only']).toBe('age')
  })

  it('supports PrecognitionValidationError instantiated with array of errors per key', () => {
    const err = new PrecognitionValidationError('Invalid data', {
      'user.email': ['Email format invalid', 'Email domain not allowed'],
      'user.name': 'Name required',
    })

    expect(err.statusCode).toBe(422)
    expect(err.errors['user.email']).toEqual(['Email format invalid', 'Email domain not allowed'])
    expect(err.errors['user.name']).toEqual(['Name required'])
  })

  it('supports PrecognitionValidationError instantiated with single string values in error map', () => {
    const err = new PrecognitionValidationError('Invalid data', {
      email: 'Email is required',
    })

    expect(err.errors.email).toEqual(['Email is required'])
  })

  it('supports passing validator function directly as shortcut argument', async () => {
    const handler = middy(async () => ({ statusCode: 200, body: 'ok' }))
      .use(precognition(dummyValidator))

    const response = await handler({
      headers: { Precognition: 'true' },
      body: { email: 'direct@example.com', age: 20 },
    }, mockContext)

    expect(response.statusCode).toBe(204)
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
          type: 'AppsyncError',
          errors: [
            { message: 'Email is required', errorType: 'ValidationError', errorInfo: { path: 'email' } },
            { message: 'Age must be at least 18', errorType: 'ValidationError', errorInfo: { path: 'age' } },
          ],
          errorCount: 2,
        },
      })
    })

    it('supports custom toValidationErrors callback', async () => {
      class ThirdPartyCustomError extends Error {
        public details = { email: 'Email is invalid format' }
      }

      const thirdPartyValidator = () => {
        throw new ThirdPartyCustomError('Validation failed in third party library')
      }

      const handler = middy(async (event: any) => event.arguments as any)
        .use(precognition<any, any>({
          validator: thirdPartyValidator,
          toValidationErrors: (err: Error) => {
            if (err instanceof ThirdPartyCustomError)
              return { message: err.message, errors: err.details }

            return null
          },
        }))

      const response = await handler(appsyncEvent, mockContext)

      expect(response).toEqual({
        error: {
          type: 'AppsyncError',
          errors: [
            { message: 'Validation failed in third party library', errorType: 'ValidationError', errorInfo: { path: 'email' } },
          ],
          errorCount: 1,
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
          type: 'AppsyncError',
          errors: [{ message: 'Resource not found', errorType: 'NotFoundError', errorInfo: { id: '123' } }],
          errorCount: 1,
        },
      })
    })

    it('re-throws non-AppSync errors', async () => {
      const handler = middy(async () => {
        throw new Error('Standard system failure')
      }).use(appsyncErrorHandler())

      await expect(handler(appsyncEvent, mockContext)).rejects.toThrow('Standard system failure')
    })

    it('ignores AppSyncError when event is not an AppSync event', async () => {
      const handler = middy(async () => {
        throw new AppSyncError('Resource not found', 'NotFoundError')
      }).use(appsyncErrorHandler())

      const nonAppSyncEvent = { headers: {}, body: '{}' }
      await expect(handler(nonAppSyncEvent, mockContext)).rejects.toThrow('Resource not found')
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
          type: 'AppsyncError',
          errors: [{ message: 'Custom mapped error', errorType: 'CustomType', errorInfo: null }],
          errorCount: 1,
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
