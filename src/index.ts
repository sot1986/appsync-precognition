import type { Context } from '@aws-appsync/utils'
import type { FullRule, NestedKeyOf, Rule } from './types'
import { runtime, util } from '@aws-appsync/utils'
import * as rules from './rules'
import { cleanString, getNestedValue, isArray, isPrecognitiveRequest, precognitiveKeys, setNestedValue } from './utils'

export function validate<T extends object>(
  obj: T,
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | Rule)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
  },
): T {
  let error: { msg?: string, errorType?: string, data?: any, errorInfo?: any } = {}

  Object.keys(checks).forEach((path) => {
    let value = getNestedValue(obj, path as NestedKeyOf<T>)
    if (typeof value === 'string') {
      value = cleanString(value, options)
      setNestedValue(obj, path as NestedKeyOf<T>, value)
    }

    let skip = false
    checks[path as NestedKeyOf<T>]?.forEach((rule) => {
      if (skip) {
        return
      }

      if (rule === 'nullable' && value === null)
        skip = true

      if (rule === 'sometimes' && typeof value === 'undefined')
        skip = true

      const result = (typeof rule === 'string' || isArray(rule))
        ? rules.parse(value, rule)
        : { ...rule }

      if (result.check)
        return

      if (error.msg)
        util.appendError(error.msg, error.errorType, error.data, error.errorInfo)

      result.message = result.message.replace(':attribute', formatAttributeName(path))
      error = {
        msg: result.message,
        errorType: 'ValidationError',
        data: null,
        errorInfo: { path, value },
      }

      skip = true
    })
  })

  if (!error.msg) {
    return obj
  }

  util.error(error.msg, error.errorType, error.data, error.errorInfo)
}

export function precognitiveValidation<T extends object>(
  ctx: Context<T>,
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | Rule)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    skipTo?: 'END' | 'NEXT'
  },
): T {
  if (!isPrecognitiveRequest(ctx)) {
    return validate(ctx.args, checks, options)
  }
  const validationKeys = precognitiveKeys(ctx)
  util.http.addResponseHeader('Precognition', 'true')

  if (!validationKeys) {
    validate(ctx.args, checks, options)
    util.http.addResponseHeader('Precognition-Success', 'true')
    runtime.earlyReturn(null)
  }

  util.http.addResponseHeader('Precognition-Validate-Only', validationKeys.join(','))
  const precognitionChecks = {} as Partial<typeof checks>
  validationKeys.forEach((key) => {
    precognitionChecks[key as NestedKeyOf<T>] = checks[key as NestedKeyOf<T>]
  })

  validate(ctx.args, precognitionChecks, options)
  util.http.addResponseHeader('Precognition-Success', 'true')
  runtime.earlyReturn(null, { skipTo: options?.skipTo ?? 'END' })
}

export function formatAttributeName(path: string): string {
  return path.split('.').reduce((acc, part) => {
    if (util.matches('^\d+$', part)) {
      return acc
    }
    return acc ? `${acc} ${part.toLowerCase()}` : part.toLowerCase()
  }, '')
}
