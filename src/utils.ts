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

export function getNestedValue<T extends object>(obj: T, path: NestedKeyOf<T>): any {
  return path.split('.').reduce<unknown>((current, key) => util.matches('^\d+$', key)
    ? (current as unknown[])[Number(key)]
    : (current as Record<string, unknown>)[key], obj)
}

export function setNestedValue<T extends object>(obj: T, path: NestedKeyOf<T>, value: unknown): void {
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
