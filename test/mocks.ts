import type { util } from '@aws-appsync/utils'

interface UtilError {
  msg: string
  errorType?: string
  data?: any
  errorInfo?: any
}

class AppsyncError extends Error {
  public errors: UtilError[] = []

  public constructor(message: string) {
    super(message)
  }
}

export function mockUtil() {
  const errors: UtilError[] = []
  function appendError(...params: Parameters<typeof util.appendError>) {
    errors.push({
      msg: params[0],
      errorType: params.at(1),
      data: params.at(2),
      errorInfo: params.at(3),
    })
  }
  function error(...params: Parameters<typeof util.error>) {
    errors.push({
      msg: params[0],
      errorType: params.at(1),
      data: params.at(2),
      errorInfo: params.at(3),
    })

    const err = new AppsyncError(params[0])
    err.errors.push(...errors)
    throw err
  }

  function matches(...params: Parameters<typeof util.matches>) {
    const regex = new RegExp(params[0])
    return !!params[1].match(regex)
  }

  return {
    appendError,
    error,
    matches,
  }
}
