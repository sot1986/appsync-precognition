import type middy from '@middy/core'
import type {
  AppSyncErrorItem,
  AppSyncMappedError,
  PrecognitionOptions,
} from './types'

export class AppSyncError extends Error implements AppSyncMappedError {
  readonly errorType: string
  readonly errorInfo: Record<string, any> | null

  constructor(
    readonly message: string,
    errorType?: string,
    errorInfo?: Record<string, any>,
  ) {
    super(message)
    Object.setPrototypeOf(this, AppSyncError.prototype)
    this.errorType = errorType ?? this.name
    this.errorInfo = errorInfo ?? null
  }

  public errorItems(): AppSyncErrorItem[] {
    return [{ message: this.message, errorType: this.errorType, errorInfo: this.errorInfo }]
  }
}

export function resolveLambdaResponseTemplate() {
  return `## [Start] Handle error or return result for request response invocation type. **
#if( $ctx.error )
  $util.error($ctx.error.message, $ctx.error.type)
#end
## [Custom Error Handling]
#if( $ctx.result.error && $ctx.result.error.type == 'AppSyncError' && $ctx.result.error.errorsCount > 0 )
  #set( $errIndex = 0 )
  #foreach( $err in $ctx.result.error.errors )
    #set( $errIndex = $errIndex + 1 )
    #if( $errIndex < $ctx.result.error.errorsCount )
      $util.appendError($err.message, $err.errorType, null, $err.errorInfo)
    #else
      $util.error($err.message, $err.errorType, null, $err.errorInfo)
    #end
  #end
#end
$util.toJson($ctx.result)
## [End] Handle error or return result for request response invocation type. **
` as const
}

export class PrecognitionValidationError extends Error implements AppSyncMappedError {
  public override readonly name: string = 'ValidationError'
  public readonly errors: { value?: unknown, path: string[], message: string }[]
  public readonly statusCode: number

  constructor(
    message: string = 'The given data was invalid.',
    errors: { value?: unknown, path: string | string[], message: string }[] | Record<string, string | string[]>,
    statusCode: number = 422,
  ) {
    super(message)
    Object.setPrototypeOf(this, PrecognitionValidationError.prototype)
    this.statusCode = statusCode

    this.errors = (Array.isArray(errors))
      ? errors.map(err => ({ ...err, path: typeof err.path === 'string'
          ? err.path.split('.')
          : err.path }))
      : Object.entries(errors).flatMap(([pathKey, val]) => {
          const messages = typeof val === 'string' ? [val] : val
          return messages.map(msg => ({ path: pathKey.split('.'), message: msg }))
        })

    if (!this.errors.length)
      throw new Error('No errors provided')
  }

  public errorItems(): AppSyncErrorItem[] {
    return this.errors.map(error => ({
      message: error.message,
      errorType: 'ValidationError',
      errorInfo: { path: error.path, value: error.value },
    }))
  }

  public validationErrors(): { value?: unknown, path: string[], message: string }[] {
    return this.errors
  }
}

export interface AppSyncEvent {
  request?: { headers?: Record<string, string> }
  response?: { headers?: Record<string, string> }
  [key: string]: any
}

export function assertAppSyncEvent(event: unknown): asserts event is AppSyncEvent {
  if (!event || typeof event !== 'object') {
    throw new TypeError('Expected event to be an AppSync event object')
  }
}

function resolveRequestHeaders(event: any): Record<string, string> {
  assertAppSyncEvent(event)
  return event.request?.headers ?? {}
}

function resolveOptions<TEvent>(
  opt: PrecognitionOptions<TEvent>,
): Required<PrecognitionOptions<TEvent>> {
  return {
    headerName: opt.headerName ?? 'Precognition',
    validateOnlyHeaderName: opt.validateOnlyHeaderName ?? 'Precognition-Validate-Only',
    successHeaderName: opt.successHeaderName ?? 'Precognition-Success',
    statusCode: opt.statusCode ?? 422,
    resolveRequestHeaders: opt.resolveRequestHeaders ?? resolveRequestHeaders,
    toValidationErrors: opt.toValidationErrors ?? ((error: Error) => hasValidationErrors(error) ? error.validationErrors : null),
    validator: opt.validator,
  }
}

export function precognition<TEvent = any, TResult = any>(
  options: PrecognitionOptions<TEvent> | PrecognitionOptions<TEvent>['validator'],
): middy.MiddlewareObj<TEvent, TResult> {
  const opt = resolveOptions(typeof options === 'function'
    ? { validator: options }
    : options,
  )
  return {
    before: async (request) => {
      const headers = new Headers(opt.resolveRequestHeaders(request.event))
      const isPrecognitive = headers.get(opt.headerName) === 'true'
      try {
        const data = await opt.validator(request.event)
        if (!isPrecognitive) {
          request.event = data
          return
        }

        assertAppSyncEvent(request.event)
        request.event.response = request.event.response || {}
        request.event.response.headers = resolveResponseHeaders(request, opt, true)
        return { data: null } as TResult
      }
      catch (error) {
        if (error instanceof Error === false)
          throw new Error(String(error))

        const validationErrors = opt.toValidationErrors(error)

        if (!validationErrors)
          throw error

        const validationKeys = headers.get(opt.validateOnlyHeaderName)
        if (!validationKeys)
          throw new PrecognitionValidationError(error.message, validationErrors)

        const keys = validationKeys.split(',')
        const precognitiveErrors: { value?: unknown, path: string[], message: string }[] = []
        validationErrors.forEach((key) => {
          const pathKey = key.path.join('.')
          if (keys.includes(pathKey))
            precognitiveErrors.push({ ...key })
        })

        if (Object.keys(precognitiveErrors).length > 0)
          throw new PrecognitionValidationError(error.message, precognitiveErrors)

        assertAppSyncEvent(request.event)
        request.event.response = request.event.response || {}
        request.event.response.headers = resolveResponseHeaders(request, opt, true)
        return { data: null } as TResult
      }
    },
    onError: async (request) => {
      if (!request.error)
        return

      if (request.error instanceof PrecognitionValidationError === false)
        return

      const responseHeaders = resolveResponseHeaders(request, opt, false)

      assertAppSyncEvent(request.event)
      request.event.response = request.event.response || {}
      request.event.response.headers = responseHeaders
      const errors = request.error.errorItems()
      request.response = {
        error: {
          type: 'AppSyncError',
          errors,
          errorsCount: errors.length,
        },
      } as unknown as TResult
      request.error = null
    },
  }
}

export function appsyncErrorHandler<TEvent, TResult>(): middy.MiddlewareObj<TEvent, TResult> {
  const onError: middy.MiddlewareFn<TEvent, TResult> = async (request) => {
    if (!request.error)
      return

    if (isAppSyncMappedError(request.error)) {
      const errorItems = typeof request.error.errorItems === 'function' ? request.error.errorItems() : request.error.errorItems
      request.response = { error: {
        type: 'AppSyncError',
        errors: errorItems,
        errorsCount: errorItems.length,
      } } as unknown as TResult
      request.error = null
    }
  }

  return { onError }
}

function resolveResponseHeaders<TEvent>(
  request: middy.Request<TEvent>,
  options: Required<Pick<PrecognitionOptions<TEvent>, 'headerName' | 'validateOnlyHeaderName' | 'successHeaderName' | 'statusCode'>>,
  success: boolean,
): Record<string, string> {
  const { headerName, validateOnlyHeaderName, successHeaderName } = options
  const requestHeaders = resolveRequestHeaders(request.event)
  const headers = new Headers(requestHeaders)
  const isPrecognitive = headers.get(headerName) === 'true'

  const respHeaders = {
    [headerName]: isPrecognitive ? 'true' : 'false',
    [successHeaderName]: success ? 'true' : 'false',
  }
  if (headers.has(validateOnlyHeaderName))
    respHeaders[validateOnlyHeaderName] = headers.get(validateOnlyHeaderName)!

  return respHeaders
}

function isAppSyncMappedError(error: object): error is AppSyncMappedError {
  return Boolean(error && typeof error === 'object' && 'errorItems' in error && (typeof (error as any).errorItems === 'function' || Array.isArray((error as any).errorItems)))
}

function hasValidationErrors(error: object): error is {
  validationErrors: { value?: unknown, path: string[], message: string }[]
} {
  return Boolean(error && typeof error === 'object' && 'validationErrors' in error && Array.isArray((error as any).validationErrors))
}
