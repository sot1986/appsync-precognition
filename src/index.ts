import type { CustomFullRule, FullRule, NestedKeyOf, ParsedRule, Rule, ValidationErrors } from './types'
import { runtime, util } from '@aws-appsync/utils'
import * as rules from './rules'
import { baseErrors, cleanString, getHeader, getNestedValue, isArray, parseErrorMessage, setNestedValue } from './utils'

function isRule<T>(rule: FullRule | CustomFullRule | Omit<Rule<T>, 'value'>): rule is Omit<Rule<T>, 'value'> {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'check')
}

function isCustomFullRule<T>(rule: FullRule | CustomFullRule | Omit<Rule<T>, 'value'>): rule is CustomFullRule {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'rule')
}

export function validate<T extends { [key in keyof T & string]: T[key] }>(
  obj: Partial<T>,
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Omit<Rule<T>, 'value'>)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    errors?: Partial<ValidationErrors>
    attributes?: Partial<Record<`:${NestedKeyOf<T>}`, string>>
  },
): T {
  let error: { msg?: string, errorType?: string, data?: any, errorInfo?: any } = {}
  const errors = { ...baseErrors, ...options?.errors }

  // Replace all array generic checks '*' with numbered checks
  Object.keys(checks).forEach((path) => {
    const keys = path.split('.')
    keys.forEach((k, idx) => {
      if (k !== '*' || idx === 0)
        return
      const parentPath = keys.slice(0, idx).join('.')
      const parentValue = getNestedValue(obj, parentPath as NestedKeyOf<T>)
      if (!isArray(parentValue))
        return

      parentValue.forEach((_, i) => {
        const idxPath = [...keys]
        idxPath[idx] = `${i}`
        checks[idxPath.join('.') as NestedKeyOf<T>] = checks[path as NestedKeyOf<T>]
      })
      delete checks[path as NestedKeyOf<T>]
    })
  })

  Object.keys(checks).forEach((path) => {
    let value = getNestedValue(obj, path as NestedKeyOf<T>)
    if (typeof value === 'string') {
      value = cleanString(value, options)
      setNestedValue(obj, path as NestedKeyOf<T>, value)
    }

    let skip = false
    checks[path as NestedKeyOf<T>]?.forEach((rule) => {
      if (skip)
        return

      const result: ParsedRule<T> = isRule(rule)
        ? { ...rule, value, msg: rule.msg ?? errors.invalid }
        : isCustomFullRule(rule)
          ? rules.parse<T>({ value, msg: rule.msg, errors }, rule.rule)
          : rules.parse<T>({ value, errors }, rule)

      skip = !!result.skipNext || !result.check

      if (result.check)
        return

      if (error.msg)
        util.appendError(error.msg, error.errorType, error.data, error.errorInfo)

      result.params = result.params ?? {}
      if (util.matches(':attr', result.msg))
        result.params[':attr'] = options?.attributes ? options.attributes[`:${path as NestedKeyOf<T>}`] ?? formatAttributeName(path) : formatAttributeName(path)

      error = {
        msg: parseErrorMessage(result.msg, result.params),
        errorType: 'ValidationError',
        data: null,
        errorInfo: { path, value },
      }
    })
  })

  if (!error.msg) {
    return obj as T
  }

  util.error(error.msg, error.errorType, error.data, error.errorInfo)
}

export function precognitiveValidation<
  T extends { [key in keyof T & string]: T[key] },
>(
  ctx: { request: { headers: any }, args: Partial<T>, stash: Record<string, any> },
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Rule<T>)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    skipTo?: 'END' | 'NEXT'
  },
): T {
  if (getHeader('precognition', ctx) !== 'true') {
    ctx.stash.__validated = validate<T>(ctx.args, checks, options)
    return ctx.stash.__validated
  }

  const validationKeys = getHeader('Precognition-Validate-Only', ctx)?.split(',').map(key => key.trim())
  util.http.addResponseHeader('Precognition', 'true')

  if (!validationKeys) {
    ctx.stash.__validated = validate(ctx.args, checks, options)
    util.http.addResponseHeader('Precognition-Success', 'true')
    runtime.earlyReturn(null)
  }

  util.http.addResponseHeader('Precognition-Validate-Only', validationKeys.join(','))
  const precognitionChecks = {} as Partial<typeof checks>
  validationKeys.forEach((key) => {
    precognitionChecks[key as NestedKeyOf<T>] = checks[key as NestedKeyOf<T>]
  })

  ctx.stash.__validated = validate(ctx.args, precognitionChecks, options)
  util.http.addResponseHeader('Precognition-Success', 'true')
  runtime.earlyReturn(null, { skipTo: options?.skipTo ?? 'END' })
}

export function formatAttributeName(path: string): string {
  return path.split('.').reduce((acc, part) => {
    if (util.matches('^\\d+$', part)) {
      return acc
    }
    let words = ''
    part.split('').forEach((char, idx) => {
      if (idx !== 0 && util.matches('[A-Z]', char)) {
        words += ' '
      }
      words += char.toLowerCase()
    })
    return acc ? `${acc} ${words}` : words
  }, '')
}

export function assertValidated<
  T extends { [key in keyof T & string]: T[key] },
>(
  ctx: { request: { headers: any }, args: Partial<T>, stash: Record<string, any> },
): asserts ctx is {
  request: {
    headers: any
  }
  args: Partial<T>
  stash: Record<string, any> & { __validated: T }
} {
  if (Object.hasOwn(ctx.stash, '__validated'))
    return
  util.error('Context arguements have not been validated')
}
