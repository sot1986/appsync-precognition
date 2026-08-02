import type middy from '@middy/core'
import type {
  AppSyncErrorItem,
  AppSyncErrorResult,
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

  public toErrorResult(): AppSyncErrorResult {
    return {
      type: 'AppSyncError',
      errors: [{ message: this.message, errorType: this.errorType, errorInfo: this.errorInfo }],
      errorsCount: 1,
    }
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
  public readonly errors: Record<string, string[]>
  public readonly statusCode: number

  constructor(
    message: string = 'The given data was invalid.',
    errors: Record<string, string | string[]>,
    statusCode: number = 422,
  ) {
    super(message)
    Object.setPrototypeOf(this, PrecognitionValidationError.prototype)
    this.statusCode = statusCode
    const errorEntries = Object.entries(errors)
    if (!errorEntries.length)
      throw new Error('No errors provided')

    this.errors = errorEntries.reduce((acc, [path, val]) => {
      const value = typeof val === 'string' ? [val] : val
      if (path in acc)
        acc[path].push(...value)
      else
        acc[path] = [...value]
      return acc
    }, {} as Record<string, string[]>)
  }

  public toErrorResult(): AppSyncErrorResult {
    const customMessage = (this.message && this.message !== 'The given data was invalid.' && this.message !== 'Validation failed')
      ? this.message
      : null

    const items: AppSyncErrorItem[] = Object.entries(this.errors).flatMap(([path, messages]) =>
      messages.map(message => ({
        message: customMessage ?? message,
        errorType: 'ValidationError',
        errorInfo: { path },
      })),
    )

    return {
      type: 'AppSyncError',
      errors: items.length > 0
        ? items
        : [{ message: this.message, errorType: 'ValidationError', errorInfo: null }],
      errorsCount: items.length > 0 ? items.length : 1,
    }
  }
}

function isAppSyncEvent(event: unknown): event is { request: { headers: Record<string, string> }, response: { headers: Record<string, string> } } {
  if (!event || typeof event !== 'object' || !('info' in event))
    return false
  const info = (event as any).info
  return Boolean(info && typeof info === 'object' && (info.fieldName || info.parentTypeName))
}

function hasHeaders(event: unknown): event is { headers: Record<string, string> } {
  return Boolean(event && typeof event === 'object' && 'headers' in event && typeof event.headers === 'object' && event.headers)
}

function resolveRequestHeaders(event: unknown): Record<string, string> {
  if (isAppSyncEvent(event) && hasHeaders(event.request))
    return event.request.headers
  if (hasHeaders(event))
    return event.headers
  return {}
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
    toValidationErrors: opt.toValidationErrors ?? (() => null),
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

        if (isAppSyncEvent(request.event)) {
          request.event.response = request.event.response || {}
          request.event.response.headers = resolveResponseHeaders(request, opt, true)
          return { data: null } as TResult
        }

        return {
          statusCode: 204,
          headers: resolveResponseHeaders(request, opt, true),
          body: '',
        } as TResult
      }
      catch (error) {
        if (error instanceof Error === false)
          throw new Error(String(error))

        const validationError = error instanceof PrecognitionValidationError
          ? error
          : opt.toValidationErrors(error)
        if (!validationError)
          throw error

        const validationKeys = headers.get(opt.validateOnlyHeaderName)
        if (!validationKeys)
          throw new PrecognitionValidationError(validationError.message, validationError.errors)

        const keys = validationKeys.split(',')
        Object.keys(validationError.errors).forEach((key) => {
          if (!keys.includes(key))
            delete validationError.errors[key]
        })

        if (Object.keys(validationError.errors).length > 0)
          throw new PrecognitionValidationError(validationError.message, validationError.errors)

        if (isAppSyncEvent(request.event)) {
          request.event.response = request.event.response || {}
          request.event.response.headers = resolveResponseHeaders(request, opt, true)
          return { data: null } as TResult
        }

        return {
          statusCode: 204,
          headers: resolveResponseHeaders(request, opt, true),
          body: '',
        } as TResult
      }
    },
    onError: async (request) => {
      if (!request.error)
        return

      if (request.error instanceof PrecognitionValidationError === false)
        return

      const responseHeaders = resolveResponseHeaders(request, opt, false)

      if (isAppSyncEvent(request.event)) {
        request.event.response = request.event.response || {}
        request.event.response.headers = responseHeaders
        request.response = { error: request.error.toErrorResult() } as unknown as TResult
        request.error = null
        return
      }

      request.response = {
        statusCode: opt.statusCode,
        headers: responseHeaders,
        body: JSON.stringify({
          message: request.error.message,
          errors: request.error.errors,
        }),
      } as unknown as TResult
      request.error = null
    },
  }
}

export function appsyncErrorHandler<TEvent, TResult>(): middy.MiddlewareObj<TEvent, TResult> {
  const onError: middy.MiddlewareFn<TEvent, TResult> = async (request) => {
    if (!request.error || !isAppSyncEvent(request.event))
      return

    if ('toErrorResult' in request.error && typeof request.error?.toErrorResult === 'function') {
      request.response = { error: request.error.toErrorResult() } as unknown as TResult
      request.error = null
    }
  }

  return { onError }
}

export function resolveResponseHeaders<TEvent>(
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
