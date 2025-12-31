import type { Rule, ShortRule } from './types'
import { util } from '@aws-appsync/utils'
import { isArray } from './utils'

export const names = {
  required: 'required',
  nullable: 'nullable',
  sometimes: 'sometimes',
  min: 'min',
  max: 'max',
  between: 'between',
  email: 'email',
  url: 'url',
  uuid: 'uuid',
  regex: 'regex',
  in: 'in',
  notIn: 'notIn',
  before: 'before',
  after: 'after',
} as const

export function parse<T>(value: T, rule: ShortRule<keyof typeof names>): Rule<T> {
  const [ruleName, params] = rule.includes(':') ? rule.split(':', 2) : [rule, '']

  switch (ruleName as keyof typeof names) {
    case 'required':
      return requiredRule(value)
    case 'nullable':
      return nullableRule(value)
    case 'sometimes':
      return sometimesRule(value)
    case 'min':
      return minRule(value, ...params.split(','))
    case 'max':
      return maxRule(value, ...params.split(', '))
    case 'between':
      return betweenRule(value, ...params.split(', '))
    case 'email':
      return emailRule(value)
    case 'url':
      return urlRule(value)
    case 'uuid':
      return uuidRule(value)
    case 'regex':
      return regexRule(value, params)
    case 'in':
      return inRule(value, ...params.split(', '))
    default:
      return { check: false, message: `Unknown rule ${ruleName}`, value }
  }
}

function minRule<T>(value: T, ...params: string[]): Rule<T> {
  const minValue = Number(params[0] ?? '0')
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be greater than or equal to ${minValue}`,
    value,
  }
  if (typeof value === 'number') {
    result.check = value >= minValue
  }
  if (typeof result.value === 'string') {
    result.check = (result.value).length >= minValue
  }
  if (isArray(value)) {
    result.check = value.length >= minValue
    result.message = `Array must contain at least ${minValue} elements`
  }
  return result
}

function maxRule<T>(value: T, ...params: string[]): Rule<T> {
  const maxValue = Number(params[0] ?? '0')
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be less than or equal to ${maxValue}`,
    value,
  }

  if (typeof value === 'number') {
    result.check = value <= maxValue
  }
  if (typeof result.value === 'string') {
    result.check = result.value.length <= maxValue
    result.message = `String must contain at most ${maxValue} characters`
  }
  if (isArray(value)) {
    result.check = value.length <= maxValue
    result.message = `Array must contain at most ${maxValue} elements`
  }
  return result
}

function betweenRule<T>(value: T, ...params: string[]): Rule<T> {
  const minValue = Number(params[0] ?? '0')
  const maxValue = Number(params[1] ?? '0')
  const result: Rule<T> = {
    check: false,
    message: `:attribute must be between ${minValue} and ${maxValue}`,
    value,
  }
  if (typeof value === 'number') {
    result.check = value >= minValue && value <= maxValue
  }
  if (typeof result.value === 'string') {
    result.check = result.value.length >= minValue && (result.value).length <= maxValue
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
    result.check = util.matches('^[^\s@]+@[^\s@]+\.[^\s@]+$', result.value as string)
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
      '^(http|https):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?$',
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
  if (typeof result.value === 'string') {
    result.check = util.matches(
      '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      value as string,
    )
  }
  return result
}

function regexRule<T>(value: T, ...params: string[]): Rule<T> {
  const regex = params[0] ?? ''
  const result: Rule<T> = {
    check: false,
    message: ':attribute must match the specified regular expression',
    value,
  }
  if (typeof result.value === 'string') {
    result.value = result.value.trim() as T
    result.check = util.matches(regex, result.value as string)
  }
  return result
}

function inRule<T>(value: T, ...params: string[]): Rule<T> {
  const result: Rule<T> = {
    check: false,
    message: ':attribute must be one of the specified values',
    value,
  }
  if (typeof result.value === 'string') {
    result.check = params.includes(result.value)
  }
  if (typeof value === 'number') {
    result.check = params.map(Number).includes(value)
  }
  return result
}

export function requiredRule<T>(value: T, ..._params: string[]): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: ':attribute is required',
    value,
  }
  if (typeof result.value === 'string') {
    result.check = result.value.length > 0
  }
  if (isArray(result.value)) {
    result.check = result.value.length > 0
  }
  if (typeof result.value === 'number') {
    result.check = true
  }
  if (result.check === false) {
    result.message = ':attribute is required'
  }
  return result
}

function nullableRule<T>(value: T, ..._params: string[]): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: '',
    value,
  }
  return result
}

function sometimesRule<T>(value: T, ..._params: string[]): Rule<T> {
  const result: Rule<T> = {
    check: true,
    message: '',
    value,
  }
  if (typeof result.value === 'undefined') {
    return result
  }
  return requiredRule(value, ..._params)
}
