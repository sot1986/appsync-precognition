import type { Ctx, CustomFullRule, DefinedRecord, FullRule, LocalizedCtx, NestedKeyOf, ParsedRule, Rule, ValidationErrors } from './types'
import { runtime, util } from '@aws-appsync/utils'
import * as rules from './rules'
import { baseErrors, cleanString, getHeader, getNestedValue, isArray, parseErrorMessage, setNestedValue } from './utils'

function isRule<T>(rule: FullRule | CustomFullRule | Omit<Rule<T>, 'value'>): rule is Omit<Rule<T>, 'value'> {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'check')
}

function isCustomFullRule<T>(rule: FullRule | CustomFullRule | Omit<Rule<T>, 'value'>): rule is CustomFullRule {
  return typeof rule === 'object' && !!rule && Object.hasOwn(rule, 'rule')
}

export function validate<T extends object>(
  obj: Partial<T>,
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Omit<Rule<T>, 'value'>)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    errors?: DefinedRecord<Partial<ValidationErrors>>
    attributes?: DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>
  },
): T {
  let error: { msg?: string, errorType?: string, data?: any, errorInfo?: any } = {}
  const errors: ValidationErrors = { ...baseErrors, ...options?.errors }

  sanitizeNestedArray(obj, checks)
  if (options?.attributes)
    sanitizeNestedArray(obj, options.attributes)

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
        result.params[':attr'] = options?.attributes?.[`:${path}`] ?? formatAttributeName(path as NestedKeyOf<T>)

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

function sanitizeNestedArray<T extends object>(
  obj: T,
  nested: object,
): void {
  Object.keys(nested).forEach((path) => {
    const keys = path.split('.')
    keys.forEach((k, idx) => {
      if (k !== '*' || idx === 0)
        return
      const parentPath = keys.slice(0, idx).join('.')
      const parentValue = parentPath.startsWith(':')
        ? getNestedValue(obj, parentPath.replace(':', '') as NestedKeyOf<T>)
        : getNestedValue(obj, parentPath as NestedKeyOf<T>)
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

export function precognitiveValidation<
  T extends object,
>(
  ctx: Ctx<T>,
  checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Rule<T>)[]>>,
  options?: {
    trim?: boolean
    allowEmptyString?: boolean
    skipTo?: 'END' | 'NEXT'
    errors?: DefinedRecord<Partial<ValidationErrors>>
    attributes?: DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>
  },
): T {
  const { errors, attributes } = (isLocalized(ctx)
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
    errors: DefinedRecord<Partial<ValidationErrors>>
    attributes: DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>
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
    precognitionChecks[key as NestedKeyOf<T>] = checks[key as NestedKeyOf<T>]
  })

  ctx.stash.__validated = validate(ctx.args, precognitionChecks, { ...options, errors, attributes })
  util.http.addResponseHeader('Precognition-Success', 'true')
  runtime.earlyReturn(null, { skipTo: options?.skipTo ?? 'END' })
  return ctx.stash.__validated
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

export function assertValidated<T extends object>(
  ctx: Ctx<T>,
): asserts ctx is Ctx<T> & {
  stash: { __validated: T }
} {
  if (Object.hasOwn(ctx.stash, '__validated'))
    return
  util.error('Context arguements have not been validated')
}

export function isLocalized<T extends object, TLocale extends string>(
  ctx: Ctx<T>,
  locale?: TLocale,
): ctx is LocalizedCtx<T, TLocale> {
  if (Object.hasOwn(ctx.stash, '__i18n') && typeof ctx.stash?.__i18n.locale === 'string') {
    return locale
      ? ctx.stash.__i18n.locale === locale
      : true
  }
  return false
}

export function assertLocalized<T extends object, TLocale extends string>(
  ctx: Ctx<T>,
  locale?: TLocale,
): asserts ctx is LocalizedCtx<T, TLocale> {
  if (isLocalized(ctx, locale))
    return
  util.error('Context arguements have not been localized')
}
