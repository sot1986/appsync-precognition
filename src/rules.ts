import type { CustomFullRule, FullRule, ParsedRule, ParseOptions } from './types'
import { util } from '@aws-appsync/utils'
import { date, datetime, email, integer, isArray, numeric, phone, time, ulid, url, uuid } from './utils'

const regexRules = {
  email,
  phone,
  url,
  uuid,
  ulid,
  integer,
  date,
  time,
  datetime,
  numeric,
} as const

export function parse<T>(
  opt: ParseOptions<T>,
  rule: FullRule | CustomFullRule,
): ParsedRule<T> {
  const [n, ...p] = typeof rule === 'string'
    ? [rule, undefined]
    : isArray(rule)
      ? [rule[0], ...rule.slice(1)]
      : typeof rule.rule === 'string'
        ? [rule.rule, undefined]
        : [rule.rule[0], ...rule.rule.slice(1)]

  switch (n) {
    case 'required':
      return requiredRule(opt)
    case 'nullable':
      return nullableRule(opt)
    case 'sometimes':
      util.error('sometimes rule is not allowed here')
      break
    case 'min':
    case 'bigger':
      return betweenRule(opt, (p[0]! as number), undefined, n === 'bigger')
    case 'max':
    case 'lower':
      return betweenRule(opt, undefined, (p[0] as number), n === 'lower')
    case 'between':
    case 'within':
      return betweenRule(opt, (p[0] as number), p[1] as number, n === 'within')
    case 'regex':
      return regexRule(opt, ...p as string[])
    case 'in':
      return inRule(opt, ...p)
    case 'notIn':
      return notInRule(opt, ...p)
    case 'before':
    case 'beforeOrEqual':
      return beforeRule(opt, p[0] as string, n === 'before')
    case 'after':
    case 'afterOrEqual':
      return afterRule(opt, p[0] as string, n === 'after')
    case 'email':
    case 'phone':
    case 'url':
    case 'uuid':
    case 'ulid':
    case 'integer':
    case 'date':
    case 'time':
    case 'datetime':
    case 'numeric':
      return regexRule({ ...opt, msg: opt.msg ?? opt.errors[n] }, regexRules[n])
    case 'unique':
      return uniqueRule(opt)
    default:
      return typeRule(opt, n)
  }
}

function betweenRule<T>(
  { value, msg, errors }: ParseOptions<T>,
  minV: number = -Infinity,
  maxV: number = Infinity,
  strict = false,
): ParsedRule<T> {
  const [min, max] = [maxV === Infinity, minV === -Infinity]
  const result: ParsedRule<T> = {
    check: false,
    msg: msg ?? (min
      ? strict
        ? errors.biggerNumber
        : errors.minNumber
      : max
        ? strict
          ? errors.lowerNumber
          : errors.maxNumber
        : strict
          ? errors.withinNumber
          : errors.betweenNumber),
    value,
    params: {
      ':min': `${minV}`,
      ':max': `${maxV}`,
    },
  }
  if (typeof value === 'number')
    result.check = strict ? value > minV && value < maxV : value >= minV && value <= maxV

  if (typeof value === 'string') {
    result.check = value.length >= minV && value.length <= maxV
    result.msg = msg ?? (min
      ? errors.minString
      : max
        ? errors.maxString
        : errors.betweenString)
  }
  if (isArray(value)) {
    result.check = value.length >= minV && value.length <= maxV
    result.msg = msg ?? (min
      ? errors.minArray
      : max
        ? errors.maxArray
        : errors.betweenArray)
  }
  return result;
}

function regexRule<T>(opt: ParseOptions<T>, ...pat: string[]): ParsedRule<T> {
  const res: ParsedRule<T> = {
    check: false,
    msg: opt.msg ?? opt.errors.regex,
    value: opt.value,
  }
  if (typeof opt.value === 'string' || typeof opt.value === 'number') {
    const valStr = typeof opt.value === 'string' ? opt.value : `${opt.value}`
    pat.forEach((p) => {
      res.check = res.check || util.matches(p, valStr)
    })
  }
  return res
}

function inRule<T>({ value, msg, errors }: ParseOptions<T>, ...p: unknown[]): ParsedRule<T> {
  return {
    check: p.includes(value),
    msg: msg ?? errors.in,
    value,
    params: { ':in': p.join(', ') },
  }
}

function notInRule<T>({ value, msg, errors }: ParseOptions<T>, ...p: unknown[]): ParsedRule<T> {
  return {
    check: !p.includes(value),
    msg: msg ?? errors.notIn,
    value,
    params: { ':notIn': p.join(', ') },
  }
}

export function requiredRule<T>({ value, msg, errors }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    msg: msg ?? errors.required,
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
    result.check = false
  }
  if (typeof value === 'undefined')
    result.check = false
  result.skipNext = !result.check
  return result
}

function nullableRule<T>({ value, msg, errors }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    msg: msg ?? errors.nullable,
    value,
    skipNext: typeof value === 'undefined' || value === null,
  }
  return result
}

export function sometimesRule<T>({ value, msg, errors, parent, key }: ParseOptions<T> & { parent: object, key: string }): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: true,
    msg: msg ?? errors.sometimes,
    value,
  }
  if (!Object.hasOwn(parent, key)) {
    result.skipNext = true
    return result
  }
  if (typeof value === 'object' && !result.value) {
    result.check = false
    result.skipNext = true
    return result
  }
  return requiredRule({ value, msg, errors })
}

function typeRule<T>({ value, msg, errors }: ParseOptions<T>, type: 'boolean' | 'object' | 'array' | 'number' | 'string'): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    msg: msg ?? errors.type,
    value,
    params: { ':type': type },
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

function beforeRule<T>({ value, msg, errors }: ParseOptions<T>, start: string, strict = false): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    msg: msg ?? (strict ? errors.before : errors.beforeOrEqual),
    value,
    params: strict
      ? { ':before': start }
      : { ':beforeOrEqual': start },
  }
  const compareValue = typeof value === 'number'
    ? util.time.epochMilliSecondsToISO8601(value > 10000000000 ? value : value * 1000)
    : value
  if (typeof compareValue !== 'string')
    return result
  result.check = strict ? compareValue < start : compareValue <= start
  return result
}

function afterRule<T>({ value, msg, errors }: ParseOptions<T>, p: string, strict = false): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    msg: msg ?? (strict ? errors.after : errors.afterOrEqual),
    value,
    params: strict
      ? { ':after': p }
      : { ':afterOrEqual': p },
  }
  const compareValue = typeof value === 'number'
    ? util.time.epochMilliSecondsToISO8601(value > 10000000000 ? value : value * 1000)
    : value
  if (typeof compareValue !== 'string')
    return result
  result.check = strict ? compareValue > p : compareValue >= p
  return result
}

function uniqueRule<T>({ value, msg, errors }: ParseOptions<T>): ParsedRule<T> {
  const result: ParsedRule<T> = {
    check: false,
    msg: msg ?? errors.unique,
    value,
  }
  if (isArray(value)) {
    const occurrences: Record<string, number> = {}
    value.forEach((item) => {
      const key = typeof item === 'string' ? item : `${item}`
      occurrences[key] = (occurrences[key] || 0) + 1
    })
    result.check = Object.values(occurrences).every(count => count === 1)
  }
  return result
}
