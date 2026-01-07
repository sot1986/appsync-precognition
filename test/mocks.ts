interface UtilError {
  msg: string
  errorType?: string
  data?: any
  errorInfo?: any
}

export class AppsyncError extends Error {
  public errors: UtilError[] = []

  public constructor(message: string) {
    super(message)
  }
}

export function mockUtil() {
  const errors: UtilError[] = []
  const headers: Record<string, string> = {}

  function appendError(msg: string, errorType?: string | undefined, data?: any, errorInfo?: any) {
    errors.push({
      msg,
      errorType,
      data,
      errorInfo,
    })
  }
  function error(msg: string, errorType?: string | undefined, data?: any, errorInfo?: any) {
    try {
      errors.push({
        msg,
        errorType,
        data,
        errorInfo,
      })

      const err = new AppsyncError(msg)
      errors.forEach((error) => {
        err.errors.push(error)
      })
      throw err
    }
    finally {
      errors.splice(0, errors.length)
    }
  }

  function matches(pattern: string, value: string) {
    const regex = new RegExp(pattern)
    return !!value.match(regex)
  }

  function parseISO8601ToEpochMilliSeconds(dateString: string): number {
    return new Date(dateString).getTime()
  }

  function addResponseHeader(key: string, value: string) {
    headers[key] = value
  }

  return {
    appendError,
    error,
    matches,
    time: {
      parseISO8601ToEpochMilliSeconds,
    },
    http: {
      addResponseHeader,
    },
  }
}

export class EarlyReturnError extends Error {
  public skipTo: 'END' | 'NEXT' = 'END'
  public constructor(message: string) {
    super(message)
  }
}

export function mockRuntime() {
  const earlyReturn = (_value: any, options?: { skipTo?: 'END' | 'NEXT' }) => {
    const err = new EarlyReturnError('Early return')
    err.skipTo = options?.skipTo ?? 'END'
    throw err
  }

  return {
    earlyReturn,
  }
}

export function assertAppsyncError(error: unknown): asserts error is AppsyncError {
  if (error instanceof AppsyncError)
    return
  throw new Error('Expected AppsynError')
}
