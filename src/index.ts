import type { Context } from '@aws-appsync/utils'
import type { NestedKeyOf, Rule, ShortRule } from './types'
import { runtime, util } from '@aws-appsync/utils'
import * as rules from './rules'
import { cleanString, getNestedValue, isPrecognitiveRequest, precognitiveKeys, setNestedValue } from './utils'

export function validate<T extends object>(
  obj: T,
  checks: Partial<Record<NestedKeyOf<T>, (ShortRule<keyof typeof rules['names']> | Rule)[]>>,
): T {
  let hasErrors = false
  const errorMessages: string[] = []

  Object.keys(checks).forEach((path) => {
    let value = getNestedValue(obj, path as NestedKeyOf<T>)
    if (typeof value === 'string') {
      value = cleanString(value)
      setNestedValue(obj, path as NestedKeyOf<T>, value)
    }

    let skip = false
    checks[path as NestedKeyOf<T>]?.forEach((rule) => {
      if (skip) {
        return
      }

      if (rule === 'nullable' && value === null) {
        skip = true
      }
      if (rule === 'sometimes' && typeof value === 'undefined') {
        skip = true
      }

      const result = (typeof rule === 'string') ? rules.parse(value, rule) : { ...rule }
      if (result.check)
        return
      hasErrors = true
      errorMessages.push(result.message)
      util.appendError(result.message, 'ValidationError', null, { path, value })
      if (rule === 'required') {
        skip = true
      }
    })
  })

  if (hasErrors) {
    util.error(errorMessages[0], 'ValidationError')
  }

  return obj
}

export function precognition<T extends object>(
  ctx: Context<T>,
  checks: Partial<Record<NestedKeyOf<T>, (ShortRule<keyof typeof rules['names']> | Rule)[]>>,
): T {
  if (!isPrecognitiveRequest(ctx)) {
    return validate(ctx.args, checks)
  }
  const validationKeys = precognitiveKeys(ctx)
  util.http.addResponseHeader('Precognition', 'true')

  if (!validationKeys) {
    validate(ctx.args, checks)
    util.http.addResponseHeader('Precognition-Success', 'true')
    runtime.earlyReturn(null)
  }

  util.http.addResponseHeader('Precognition-Validate-Only', validationKeys.join(','))
  const precognitionChecks = {} as Partial<typeof checks>
  validationKeys.forEach((key) => {
    precognitionChecks[key as NestedKeyOf<T>] = checks[key as NestedKeyOf<T>]
  })

  validate(ctx.args, precognitionChecks)
  util.http.addResponseHeader('Precognition-Success', 'true')
  runtime.earlyReturn(null)
}
