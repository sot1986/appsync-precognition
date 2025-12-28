import type { NestedKeyOf, Rule, ShortRule } from './types'
import { util } from '@aws-appsync/utils'
import * as rules from './rules'
import { getNestedValue, setNestedValue } from './utils'

export function validate<T extends object>(
  obj: T,
  checks: Partial<Record<NestedKeyOf<T>, (ShortRule<keyof typeof rules['names']> | Rule)[]>>,
): T {
  let hasErrors = false
  const errorMessages: string[] = []

  Object.keys(checks).forEach((path) => {
    const value = getNestedValue(obj, path as NestedKeyOf<T>)
    if (typeof value === 'string') {
      setNestedValue(obj, path as NestedKeyOf<T>, value.trim())
    }

    checks[path as NestedKeyOf<T>]?.forEach((rule) => {
      const result = (typeof rule === 'string') ? rules.parse(value, rule) : { ...rule }
      if (result.check)
        return
      hasErrors = true
      errorMessages.push(result.message)
      util.appendError(result.message, 'ValidationError', null, { path, value })
    })
  })

  if (hasErrors) {
    util.error(errorMessages[0], 'ValidationError')
  }

  return obj
}
