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
      return minRule(value, (params[0]! as number))
    case 'max':
      return maxRule(value, (params[0] as number))
    case 'between':
      return betweenRule(value, (params[0] as number), params[1] as number)
    case 'regex':
      return regexRule(value, ...params as string[])
    case 'in':
      return inRule(value, ...params)
    case 'notIn':
      return notInRule(value, ...params)
    case 'array':
      return arrayRule(value)
    case 'object':
      return objectRule(value)
    case 'boolean':
      return booleanRule(value)
    case 'number':
      return numberRule(value)
    case 'string':
      return stringRule(value)
    case 'before':
      return beforeRule(value, params[0] as string)
    case 'after':
      return afterRule(value, params[0] as string)
    case 'beforeOrEqual':
      return beforeOrEqualRule(value, params[0] as string)
    case 'afterOrEqual':
      return afterOrEqualRule(value, params[0] as string)
    default:
      return { check: false, message: `Unknown rule ${name}`, value }
  }
}

function minRule<T>(value: T, minValue: number): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be greater than or equal to ${minValue}`,
    value,
  }
  if (typeof value === 'number') {
    result.check = value >= minValue
  }
  if (typeof value === 'string') {
    result.check = value.length >= minValue
  }
  if (isArray(value)) {
    result.check = value.length >= minValue
    result.message = `Array must contain at least ${minValue} elements`
  }
  return result
}

function maxRule<T>(value: T, maxValue: number): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be less than or equal to ${maxValue}`,
    value,
  }

  if (typeof value === 'number') {
    result.check = value <= maxValue
  }
  if (typeof value === 'string') {
    result.check = value.length <= maxValue
    result.message = `String must contain at most ${maxValue} characters`
  }
  if (isArray(value)) {
    result.check = value.length <= maxValue
    result.message = `Array must contain at most ${maxValue} elements`
  }
  return result
}

function betweenRule<T>(value: T, minValue: number = -Infinity, maxValue: number = Infinity): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be between ${minValue} and ${maxValue}`,
    value,
  }
  if (typeof value === 'number')
    result.check = value >= minValue && value <= maxValue
  if (typeof value === 'string') {
    result.check = value.length >= minValue && value.length <= maxValue
    result.message = `String must contain between ${minValue} and ${maxValue} characters`
  }
  if (isArray(value)) {
    result.check = value.length >= minValue && value.length <= maxValue
    result.message = `Array must contain between ${minValue} and ${maxValue} elements`
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

function arrayRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be an array',
    value,
  }
  if (isArray(value)) {
    result.check = true
  }
  return result
}

function objectRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be an object',
    value,
  }
  if (typeof value === 'object' && !isArray(result.value)) {
    result.check = true
  }
  return result
}

function booleanRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a boolean',
    value,
  }
  if (typeof value === 'boolean') {
    result.check = true
  }
  return result
}

function numberRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a number',
    value,
  }
  if (typeof value === 'number') {
    result.check = true
  }
  return result
}

function stringRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a string',
    value,
  }
  if (typeof value === 'string') {
    result.check = true
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
