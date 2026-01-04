import type { FullRule, Rule } from './types'
import { util } from '@aws-appsync/utils'
import { isArray } from './utils'

export function parse<T>(value: T, rule: FullRule): Rule<T> {
  const [name, ...params] = typeof rule === 'string'
    ? [rule, undefined]
    : [rule[0], ...rule.slice(1)]

  switch (name) {
    case 'required':
      return requiredRule(value)
    case 'nullable':
      return nullableRule(value)
    case 'sometimes':
      return sometimesRule(value)
    case 'min':
      return betweenRule(value, (params[0]! as number))
    case 'max':
      return betweenRule(value, undefined, (params[0] as number))
    case 'between':
      return betweenRule(value, (params[0] as number), params[1] as number)
    case 'regex':
      return regexRule(value, ...params as string[])
    case 'in':
      return inRule(value, ...params)
    case 'notIn':
      return notInRule(value, ...params)
    case 'before':
      return beforeRule(value, params[0] as string)
    case 'after':
      return afterRule(value, params[0] as string)
    case 'beforeOrEqual':
      return beforeOrEqualRule(value, params[0] as string)
    case 'afterOrEqual':
      return afterOrEqualRule(value, params[0] as string)
    default:
      return typeRule(value, name)
  }
}

function betweenRule<T>(value: T, minValue: number = -Infinity, maxValue: number = Infinity): Rule<T> {
  const [min, max] = [minValue === -Infinity, maxValue === Infinity]
  const result: Rule<T> = {
    check: false,
    message: min ? `:attribute should be at most ${maxValue}` : max ? `:attribute should be at least ${minValue}` : `:attribute must be between ${minValue} and ${maxValue}`,
    value,
  }
  if (typeof value === 'number')
    result.check = value >= minValue && value <= maxValue
  if (typeof value === 'string') {
    result.check = value.length >= minValue && value.length <= maxValue
    result.message = min
      ? `String must not exceed ${maxValue} characters`
      : max
        ? `String must contain at least ${minValue} characters`
        : `String must contain between ${minValue} and ${maxValue} characters`
  }
  if (isArray(value)) {
    result.check = value.length >= minValue && value.length <= maxValue
    result.message = min
      ? `Array must not contain more than ${maxValue} elements`
      : max
        ? `Array must contain at least ${minValue} elements`
        : `Array must contain between ${minValue} and ${maxValue} elements`
  }
  return result
}

function regexRule<T>(value: T, ...patterns: string[]): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must match the specified regular expression',
    value,
  }
  if (typeof value === 'string') {
    result.check = patterns.some(pattern => util.matches(pattern, value))
  }
  return result
}

function inRule<T>(value: T, ...params: unknown[]): Rule<T> {
  return {
    check: params.includes(value),
    message: ':attribute must be one of the specified values',
    value,
  }
}

function notInRule<T>(value: T, ...params: unknown[]): Rule<T> {
  return {
    check: !params.includes(value),
    message: ':attribute must not be one of the specified values',
    value,
  }
}

export function requiredRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: ':attribute is required',
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
    result.message = ':attribute is not nullable'
    result.check = false
  }
  if (typeof value === 'undefined')
    result.check = false
  result.skipNext = !result.check
  return result
}

function nullableRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: ':attribute must be nullable',
    value,
    skipNext: typeof value === 'undefined' || value === null,
  }
  return result
}

function sometimesRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: ':attribute is not nullable',
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
  return requiredRule(value)
}

function typeRule<T>(value: T, type: 'boolean' | 'object' | 'array' | 'number' | 'string'): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be a ${type}`,
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

function beforeRule<T>(value: T, start: string): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be before ${start}`,
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

function afterRule<T>(value: T, start: string): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be after ${start}`,
    value,
  }
  const startValue = util.time.parseISO8601ToEpochMilliSeconds(start)

  if (typeof value === 'string') {
    const date = util.time.parseISO8601ToEpochMilliSeconds(value)
    result.check = date > startValue
  }

  if (typeof value === 'number') {
    result.check = value > startValue
  }
  return result
}

function beforeOrEqualRule<T>(value: T, start: string): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be before or equal to ${start}`,
    value,
  }
  const startValue = util.time.parseISO8601ToEpochMilliSeconds(start)

  if (typeof value === 'string') {
    const date = util.time.parseISO8601ToEpochMilliSeconds(value)
    result.check = date <= startValue
  }

  if (typeof value === 'number') {
    result.check = value <= startValue
  }
  return result
}

function afterOrEqualRule<T>(value: T, start: string): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be after or equal to ${start}`,
    value,
  }
  const startValue = util.time.parseISO8601ToEpochMilliSeconds(start)

  if (typeof value === 'string') {
    const date = util.time.parseISO8601ToEpochMilliSeconds(value)
    result.check = date >= startValue
  }

  if (typeof value === 'number') {
    result.check = value >= startValue
  }
  return result
}
