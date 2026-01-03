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
    case 'between': {
      return betweenRule(value, (params[0] as number), params[1] as number)
    }
    case 'email':
      return emailRule(value)
    case 'url':
      return urlRule(value)
    case 'uuid':
      return uuidRule(value)
    case 'ulid':
      return ulidRule(value)
    case 'regex':
      return regexRule(value, params[0] as string)
    case 'in':
      return inRule(value, ...params)
    case 'notIn': {
      return notInRule(value, ...params)
    }
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
    case 'date':
      return dateRule(value)
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

function betweenRule<T>(value: T, minValue: number, maxValue: number): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be between ${minValue} and ${maxValue}`,
    value,
  }
  if (typeof value === 'number') {
    result.check = value >= minValue && value <= maxValue
  }
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

function emailRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a valid email address',
    value,
  }

  if (typeof value === 'string') {
    result.check = util.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', result.value as string)
  }
  return result
}

function urlRule<T>(value: T): Rule<T> {
  const result = {
    check: false,
    message: ':attribute must be a valid URL',
    value,
  }
  if (typeof value === 'string') {
    result.check = util.matches(
      '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$|^https?:\\/\\/(localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?(\\/.*)?$',
      result.value as string,
    )
  }
  return result
}

function uuidRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a valid UUID',
    value,
  }
  if (typeof value === 'string') {
    result.check = util.matches(
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      value as string,
    )
  }
  return result
}

function ulidRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a valid ULID',
    value,
  }
  if (typeof value === 'string') {
    // ULID format: 26 characters, base32 encoded (0-9, A-Z excluding I, L, O, U)
    result.check = util.matches(
      '^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$',
      value as string,
    )
  }
  return result
}

function regexRule<T>(value: T, pattern: string): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must match the specified regular expression',
    value,
  }
  if (typeof value === 'string') {
    result.value = value.trim() as T
    result.check = util.matches(pattern, result.value as string)
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
  }
  if (typeof value === 'string') {
    result.check = value.length > 0
  }
  if (isArray(value)) {
    result.check = value.length > 0
  }
  if (typeof value === 'number') {
    result.check = true
  }
  if (typeof value === 'boolean') {
    result.check = true
  }
  if (typeof value === 'object' && !result.value) {
    result.message = ':attribute is not nullable'
    result.check = false
  }
  if (typeof value === 'undefined') {
    result.check = false
  }
  return result
}

function nullableRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: '',
    value,
  }
  return result
}

function sometimesRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: '',
    value,
  }
  if (typeof value === 'undefined') {
    return result
  }
  if (typeof value === 'object' && !result.value) {
    result.message = ':attribute is not nullable'
    result.check = false
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

function dateRule<T>(value: T): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be a date',
    value,
  }
  if (typeof value === 'string') {
    result.check = util.matches(
      '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3,6}Z$',
      result.value as string,
    )
  }
  if (typeof value === 'number') {
    result.check = true
  }
  return result
}
