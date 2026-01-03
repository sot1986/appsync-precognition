import type { Context } from '@aws-appsync/utils'
import type { NestedKeyOf } from './types'
import { util } from '@aws-appsync/utils'

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isArray(value: unknown): value is unknown[] {
  if (typeof value === 'object' && !!value && Object.hasOwn(value, 'length')) {
    return typeof (value as unknown[]).length === 'number'
  }
  return false
}

export function getNestedValue<T extends { [key in keyof T & string]: T[key] }>(obj: Partial<T>, path: NestedKeyOf<T>): any {
  return path.split('.').reduce<unknown>((current, key) => util.matches('^\d+$', key)
    ? (current as unknown[])[Number(key)]
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

export function getHeader(name: string, ctx: Context): string | null {
  return Object.entries(ctx.request.headers)
    .reduce((prev, [key, value]) => typeof prev === 'string'
      ? prev
      : (key.toLowerCase() === name.toLowerCase() && typeof value === 'string'
          ? value
          : null), null as string | null)
}

export function isPrecognitiveRequest(ctx: Context): boolean {
  return getHeader('precognition', ctx) === 'true'
}

export function precognitiveKeys(ctx: Context): string[] | null {
  const keys = getHeader('Precognition-Validate-Only', ctx)
  return keys ? keys.split(',').map(key => key.trim()) : null
}

export function cleanString(value: string, options?: {
  trim?: boolean
  allowEmptyString?: boolean
}): string | null {
  if (options?.trim === false)
    return value

  let parsed: string | null = value.trim()

  if (options?.allowEmptyString)
    return parsed

  if (parsed === '')
    parsed = null

  return parsed
}
