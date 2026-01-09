import type { ErrorMsgParams, ValidationErrors } from './types'
import { util } from '@aws-appsync/utils'

export function isArray(value: unknown): value is unknown[] {
  return typeof value === 'object' && !!value && typeof (value as unknown[] | undefined)?.length === 'number'
}

export function getNestedValue(obj: object, path: string): any {
  return path.split('.').reduce<unknown>((current, key) => util.matches('^\\d+$', key)
    ? (current as unknown[])[toNumber(key)]
    : (current as Record<string, unknown>)[key], obj)
}

export function setNestedValue(obj: object, path: string, value: unknown): void {
  const keys = path.split('.')
  if (keys.length === 1) {
    (obj as any)[keys[0] as keyof typeof obj] = value as any
    return
  }
  const lastKey = keys.pop() as string
  const parentObject = getNestedValue(obj, keys.join('.'))
  if (typeof parentObject === 'object' && !!parentObject) {
    parentObject[lastKey] = value
  }
}

export function getHeader(name: string, ctx: { request: { headers: any } }): string | null {
  const lowerCaseName = name.toLowerCase()
  const key = Object.keys(ctx.request.headers).find(h => h.toLowerCase() === lowerCaseName)
  return key ? ctx.request.headers[key] : null
}

export function cleanString(value: string, options?: {
  trim?: boolean
  allowEmptyString?: boolean
}): string | null {
  if (options?.trim === false)
    return value
  const parsed: string | null = value.trim()
  if (options?.allowEmptyString)
    return parsed
  return parsed === '' ? null : parsed
}

export function toNumber(value: string): number {
  switch (true) {
    case util.matches('^(-|\\+)?\\d+(\\.\\d+)?$', value):
      return +value
    case util.matches('^(-|\\+)?Infinity$', value):
      return +value
    default:
      util.error(`Invalid number: ${value}`)
  }
}

export const uuid = `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
export const ulid = '^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$'
export const url = '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$|^https?:\\/\\/(localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?(\\/.*)?$'
export const email = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
export const phone = '^\\+[1-9]\\d{1,20}$'
export const date = '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'
export const time = '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,6})?Z?$'
export const datetime = '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,6})?Z$'
export const numeric = '^-?\\d+(\\.\\d+)?$'
export const integer = '^-?\\d+$'

export const baseErrors: ValidationErrors = {
  maxNumber: ':attr max value is :max',
  minNumber: ':attr min value is :min',
  betweenNumber: ':attr value must be between :min and :max',
  biggerNumber: ':attr must be bigger than :min',
  lowerNumber: ':attr must be lower than :max',
  withinNumber: ':attr must be within :min and :max',
  maxString: ':attr must not exceed :max characters',
  minString: ':attr must have at least :min characters',
  betweenString: ':attr must have between :min and :max characters',
  minArray: ':attr must have at least :min elements',
  maxArray: ':attr must have at most :max elements',
  betweenArray: ':attr must have between :min and :max elements',
  in: ':attr must be one of the specified values: :in',
  notIn: ':attr must not be one of this list: :notIn',
  email: ':attr must be a valid email address (name@domain.com)',
  phone: ':attr must be a valid phone number (+123...)',
  url: ':attr must be a valid URL (:pattern)',
  uuid: ':attr must be a valid UUID (:pattern)',
  ulid: ':attr must be a valid ULID (:pattern)',
  date: ':attr must be a valid date (:pattern)',
  time: ':attr must be a valid time (:pattern)',
  datetime: ':attr must be a valid datetime (:pattern)',
  numeric: ':attr must be a valid number (:pattern)',
  integer: ':attr must be a valid integer (:pattern)',
  type: ':attr is not valid :type',
  regex: ':attr must match :pattern',
  regex_patterns: 'attr: must match any of :patterns',
  required: ':attr is required',
  nullable: ':attr is nullable',
  sometimes: ':attr cannot be null',
  before: ':attr must be before :before',
  beforeOrEqual: ':attr must be before or equal to :beforeOrEqual',
  after: ':attr must be after :after',
  afterOrEqual: ':attr must be after or equal to :afterOrEqual',
  invalid: ':attr is not valid',
}

export function parseErrorMessage(msg: string, params?: ErrorMsgParams): string {
  let parsedMsg = msg
  Object.entries(params ?? {}).forEach(([key, value]) => {
    parsedMsg = parsedMsg.replaceAll(key, value)
  })
  return parsedMsg
}
