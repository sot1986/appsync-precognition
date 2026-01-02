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
  function appendError(msg: string, errorType?: string | undefined, data?: any, errorInfo?: any) {
    errors.push({
      msg,
      errorType,
      data,
      errorInfo,
    })
  }
  function error(msg: string, errorType?: string | undefined, data?: any, errorInfo?: any) {
    errors.push({
      msg,
      errorType,
      data,
      errorInfo,
    })

    const err = new AppsyncError(msg)
    err.errors.push(...errors)
    throw err
  }

  function matches(pattern: string, value: string) {
    const regex = new RegExp(pattern)
    return !!value.match(regex)
  }

  return {
    appendError,
    error,
    matches,
  }
}
