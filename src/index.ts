import type { Ctx, CustomFullRule, FullRule, I18n, NestedKeyOf, Rule, ValidationErrors } from './types'
import { runtime, util } from '@aws-appsync/utils'
import * as rules from './rules'
import { baseErrors, cleanString, getHeader, getNestedValue, isArray, parseErrorMessage, setNestedValue } from './utils'

function isRule(rule: FullRule | CustomFullRule | Omit<Rule, 'value'>): rule is Omit<Rule, 'value'> {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'check')
}

function isCustomFullRule(rule: FullRule | CustomFullRule | Omit<Rule, 'value'>): rule is CustomFullRule {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'rule')
}

export function validate<T extends { [key in keyof T & string]: T[key] }>(
  obj: Readonly<Partial<T>>,
  checks: Partial<{
    [key in NestedKeyOf<T>]: Array<
      | FullRule
      | CustomFullRule
      | Omit<Rule<T>, 'value'>
    > }>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    errors?: Partial<ValidationErrors>
    attributes?: Partial<Record<`:${NestedKeyOf<T>}`, string>>
  },
): T {
  let error: { msg?: string, errorType?: string, data?: any, errorInfo?: any } = {}
  const errors: ValidationErrors = { ...baseErrors, ...options?.errors }

  sanitizeNestedArray(obj, checks)
  if (options?.attributes)
    sanitizeNestedArray(obj, options.attributes)

  const validated: T = JSON.parse(JSON.stringify(obj))
  Object.keys(checks).forEach((path) => {
    let value = getNestedValue(validated, path as NestedKeyOf<T>)
    if (typeof value === 'string') {
      value = cleanString(value, options)
      setNestedValue(validated, path as NestedKeyOf<T>, value)
    }

    let skip: boolean = false
    checks[path as keyof typeof checks]?.forEach((rule) => {
      if (skip)
        return

      const result = isRule(rule)
        ? { ...rule, value, msg: rule.msg ?? errors.invalid }
        : isCustomFullRule(rule)
          ? rules.parse({ value, msg: rule.msg, errors }, rule.rule)
          : rules.parse({ value, errors }, rule)

      skip = !!result.skipNext || !result.check

      if (result.check)
        return

      if (error.msg)
        util.appendError(error.msg, error.errorType, error.data, error.errorInfo)

      result.params = result.params ?? {}

      if (util.matches(':attr', result.msg))
        result.params[':attr'] = options?.attributes?.[`:${path as NestedKeyOf<T>}`] ?? formatAttributeName(path as NestedKeyOf<T>)

      error = {
        msg: parseErrorMessage(result.msg, result.params),
        errorType: 'ValidationError',
        data: null,
        errorInfo: { path, value },
      }
    })
  })

  if (!error.msg) {
    return validated as T
  }

  util.error(error.msg, error.errorType, error.data, error.errorInfo)
}

function sanitizeNestedArray(
  obj: object,
  nested: object,
): void {
  Object.keys(nested).forEach((path) => {
    const keys = path.split('.')
    keys.forEach((k, idx) => {
      if (k !== '*' || idx === 0)
        return
      const parentPath = keys.slice(0, idx).join('.')
      const parentValue = getNestedValue(
        obj,
        parentPath.startsWith(':') ? parentPath.slice(1) : parentPath,
      )

      if (!isArray(parentValue))
        return

      parentValue.forEach((_, i) => {
        const idxPath = [...keys]
        idxPath[idx] = `${i}`
        nested[idxPath.join('.') as keyof typeof nested] = nested[path as keyof typeof nested]
      })
      delete nested[path as keyof typeof nested]
    })
  })
}

export function precognitiveValidation<T extends { [key in keyof T & string]: T[key] }>(
  ctx: Ctx<Partial<T>>,
  checks: Partial<{
    [key in NestedKeyOf<T>]: Array<
      | FullRule
      | CustomFullRule
      | Omit<Rule, 'value'>
    > }>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    skipTo?: 'END' | 'NEXT'
    errors?: Partial<ValidationErrors>
    attributes?: Partial<Record<`:${NestedKeyOf<T>}`, string>>
  },
): T {
  const { errors, attributes } = (isLocalized<T, string>(ctx)
    ? {
        errors: {
          ...ctx.stash.__i18n.errors,
          ...options?.errors,
        },
        attributes: {
          ...ctx.stash.__i18n.attributes,
          ...options?.attributes,
        },
      }
    : { errors: options?.errors, attributes: options?.attributes }) as {
    errors: Partial<ValidationErrors>
    attributes: Partial<Record<`:${NestedKeyOf<T>}`, string>>
  }
  if (getHeader('precognition', ctx) !== 'true')
    return ctx.stash.__validated = validate<T>(ctx.args, checks, { ...options, errors, attributes })

  const validationKeys = getHeader('Precognition-Validate-Only', ctx)?.split(',').map(key => key.trim())
  util.http.addResponseHeader('Precognition', 'true')

  if (!validationKeys) {
    ctx.stash.__validated = validate(ctx.args, checks, { ...options, errors, attributes })
    util.http.addResponseHeader('Precognition-Success', 'true')
    runtime.earlyReturn(null)
  }

  util.http.addResponseHeader('Precognition-Validate-Only', validationKeys.join(','))
  const precognitionChecks = {} as Partial<typeof checks>
  validationKeys.forEach((key) => {
    precognitionChecks[key as keyof typeof precognitionChecks] = checks[key as keyof typeof checks]
  })

  ctx.stash.__validated = validate(ctx.args, precognitionChecks, { ...options, errors, attributes })
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
  T extends { [key in keyof T]: T[key] },
>(
  ctx: Ctx<Partial<T>>,
): asserts ctx is typeof ctx & {
  stash: { __validated: T }
} {
  if (Object.hasOwn(ctx.stash, '__validated'))
    return
  util.error('Context arguments have not been validated')
}

export function isLocalized<
  T extends { [key in keyof T]: T[key] },
  TLocale extends string,
>(
  ctx: Ctx<Partial<T>>,
  locale?: TLocale,
): ctx is typeof ctx & {
  stash: typeof ctx.stash & {
    __i18n: I18n<T, string>
  }
} {
  if (Object.hasOwn(ctx.stash, '__i18n') && typeof ctx.stash?.__i18n.locale === 'string') {
    return locale
      ? ctx.stash.__i18n.locale === locale
      : true
  }
  return false
}

export function assertLocalized<
  T extends { [key in keyof T]: T[key] },
  TLocale extends string,
>(
  ctx: Ctx<Partial<T>>,
  locale?: TLocale,
): asserts ctx is typeof ctx & {
  stash: typeof ctx.stash & {
    __i18n: I18n<T, string>
  }
} {
  if (isLocalized<T, TLocale>(ctx, locale))
    return
  util.error('Context arguements have not been localized')
}

export type { CustomFullRule, FullRule, I18n, Rule, ValidationErrors } from './types'
