import type { CustomFullRule, FullRule, ParsedRule, ParseOptions } from './types'
import { util } from '@aws-appsync/utils'
import { isArray } from './utils'

export function parse<T>(
  o: ParseOptions<T>,
  r: FullRule | CustomFullRule,
): ParsedRule<T> {
  const [n, ...p] = typeof r === 'string'
    ? [r, undefined]
    : isArray(r)
      ? [r[0], ...r.slice(1)]
      : typeof r.rule === 'string'
        ? [r.rule, undefined]
        : [r.rule[0], ...r.rule.slice(1)]

  switch (n) {
    case 'required':
      return requiredRule(o)
    case 'nullable':
      return nullableRule(o)
    case 'sometimes':
      return sometimesRule(o)
    case 'min':
      return betweenRule(o, (p[0]! as number))
    case 'max':
      return betweenRule(o, undefined, (p[0] as number))
    case 'between':
      return betweenRule(o, (p[0] as number), p[1] as number)
    case 'regex':
      return regexRule(o, ...p as string[])
    case 'in':
      return inRule(o, ...p)
    case 'notIn':
      return notInRule(o, ...p)
    case 'before':
      return beforeRule(o, p[0] as string)
    case 'after':
      return afterRule(o, p[0] as string)
    case 'beforeOrEqual':
      return beforeOrEqualRule(o, p[0] as string)
    case 'afterOrEqual':
      return afterOrEqualRule(o, p[0] as string)
    default:
      return typeRule(o, n)
  }
}

function betweenRule<T>({ value, message: m }: ParseOptions<T>, minV: number = -Infinity, maxV: number = Infinity): ParsedRule<T> {
  const [min, max] = [minV === -Infinity, maxV === Infinity]
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? min ? `:attribute should be at most ${maxV}` : max ? `:attribute should be at least ${minV}` : `:attribute must be between ${minV} and ${maxV}`,
    value,
  }
  if (typeof value === 'number')
    result.check = value >= minV && value <= maxV
  if (typeof value === 'string') {
    result.check = value.length >= minV && value.length <= maxV
    result.message = m ?? min
      ? `String must not exceed ${maxV} characters`
      : max
        ? `String must contain at least ${minV} characters`
        : `String must contain between ${minV} and ${maxV} characters`
  }
  if (isArray(value)) {
    result.check = value.length >= minV && value.length <= maxV
    result.message = m ?? min
      ? `Array must not contain more than ${maxV} elements`
      : max
        ? `Array must contain at least ${minV} elements`
        : `Array must contain between ${minV} and ${maxV} elements`
  }
  return result
}

function regexRule<T>({ value, message: m }: ParseOptions<T>, ...p: string[]): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? ':attribute must match the specified regular expression',
    value,
  }
  if (typeof value === 'string') {
    result.check = p.some(pt => util.matches(pt, value))
  }
  return result
}

function inRule<T>({ value, message: m }: ParseOptions<T>, ...p: unknown[]): ParsedRule<T> {
  return {
    check: p.includes(value),
    message: m ?? ':attribute must be one of the specified values',
    value,
  }
}

function notInRule<T>({ value, message: m }: ParseOptions<T>, ...p: unknown[]): ParsedRule<T> {
  return {
    check: !p.includes(value),
    message: m ?? ':attribute must not be one of the specified values',
    value,
  }
}

export function requiredRule<T>({ value, message: m }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    message: m ?? ':attribute is required',
    value,
    skipNext: true,
  }
  if (typeof value === 'string')
    result.check = value.length > 0
  if (isArray(value))
    result.check = value.length > 0
  if (typeof value === 'number')
    result.check = true
  if (typeof value === 'boolean')
    result.check = true
  if (typeof value === 'object' && !result.value) {
    result.message = m ?? ':attribute is not nullable'
    result.check = false
  }
  if (typeof value === 'undefined')
    result.check = false
  result.skipNext = !result.check
  return result
}

function nullableRule<T>({ value, message: m }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    message: m ?? ':attribute must be nullable',
    value,
    skipNext: typeof value === 'undefined' || value === null,
  }
  return result
}

function sometimesRule<T>({ value, message: m }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    message: m ?? ':attribute is not nullable',
    value,
  }
  if (typeof value === 'undefined') {
    result.skipNext = true
    return result
  }
  if (typeof value === 'object' && !result.value) {
    result.check = false
    result.skipNext = true
    return result
  }
  return requiredRule({ value, message: m })
}

function typeRule<T>({ value, message: m }: ParseOptions<T>, type: 'boolean' | 'object' | 'array' | 'number' | 'string'): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? `:attribute must be a ${type}`,
    value,
  }
  switch (type) {
    case 'array':
      result.check = isArray(value)
      break
    case 'object':
      result.check = typeof value === 'object' && !!value && !isArray(value) && Object.keys(value).length > 0
      break
    case 'boolean':
      result.check = typeof value === 'boolean'
      break
    case 'number':
      result.check = typeof value === 'number'
      break
    default:
      result.check = typeof value === 'string'
  }
  return result
}

function beforeRule<T>({ value, message: m }: ParseOptions<T>, start: string): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? `:attribute must be before ${start}`,
    value,
  }
  const startValue = util.time.parseISO8601ToEpochMilliSeconds(start)

  if (typeof value === 'string') {
    const date = util.time.parseISO8601ToEpochMilliSeconds(value)
    result.check = date < startValue
  }

  if (typeof value === 'number') {
    result.check = value < startValue
  }
  return result
}

function afterRule<T>({ value, message: m }: ParseOptions<T>, p: string): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? `:attribute must be after ${p}`,
    value,
  }
  const e = util.time.parseISO8601ToEpochMilliSeconds(p)

  if (typeof value === 'string')
    result.check = util.time.parseISO8601ToEpochMilliSeconds(value) > e

  if (typeof value === 'number')
    result.check = value > e

  return result
}

function beforeOrEqualRule<T>({ value, message: m }: ParseOptions<T>, p: string): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? `:attribute must be before or equal to ${p}`,
    value,
  }
  const s = util.time.parseISO8601ToEpochMilliSeconds(p)

  if (typeof value === 'string')
    result.check = util.time.parseISO8601ToEpochMilliSeconds(value) <= s

  if (typeof value === 'number')
    result.check = value <= s

  return result
}

function afterOrEqualRule<T>({ value, message: m }: ParseOptions<T>, p: string): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    message: m ?? `:attribute must be after or equal to ${p}`,
    value,
  }
  const e = util.time.parseISO8601ToEpochMilliSeconds(p)

  if (typeof value === 'string')
    result.check = util.time.parseISO8601ToEpochMilliSeconds(value) >= e

  if (typeof value === 'number')
    result.check = value >= e

  return result
}
