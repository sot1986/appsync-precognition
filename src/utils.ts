import type { NestedKeyOf } from './types'
import { util } from '@aws-appsync/utils'

export function isArray(value: unknown): value is unknown[] {
  return typeof value === 'object' && !!value && typeof (value as unknown[] | undefined)?.length === 'number'
}

export function getNestedValue<T extends { [key in keyof T & string]: T[key] }>(obj: Partial<T>, path: NestedKeyOf<T>): any {
  return path.split('.').reduce<unknown>((current, key) => util.matches('^\\d+$', key)
    ? (current as unknown[])[toNumber(key)]
    : (current as Record<string, unknown>)[key], obj)
}

export function setNestedValue<T extends { [key in keyof T & string]: T[key] }>(obj: Partial<T>, path: NestedKeyOf<T>, value: unknown): void {
  const keys = path.split('.')
  if (keys.length === 1) {
    obj[keys[0] as keyof typeof obj] = value as any
    return
  }
  const lastKey = keys.pop() as string
  const parentObject = getNestedValue(obj, keys.join('.') as NestedKeyOf<T>)
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
