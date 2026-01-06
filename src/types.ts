export {}

export type FullRule
  = 'required'
    | 'nullable'
    | 'sometimes'
    | 'number'
    | 'boolean'
    | 'string'
    | 'array'
    | 'object'
    | 'url'
    | 'email'
    | 'uuid'
    | 'ulid'
    | 'date'
    | 'datetime'
    | 'time'
    | 'integer'
    | 'numeric'
    | 'phone'
    | ['min', number]
    | ['max', number]
    | ['bigger', number]
    | ['lower', number]
    | ['between', number, number]
    | ['within', number, number]
    | ['regex', ...string[]]
    | ['in', ...(string | number | boolean | null)[]]
    | ['notIn', ...(string | number | boolean | null)[]]
    | ['after', string]
    | ['before', string]
    | ['afterOrEqual', string]
    | ['beforeOrEqual', string]

export interface CustomFullRule {
  rule: FullRule
  msg?: string
  skipNext?: boolean
}

export interface Rule<T = unknown> {
  check: boolean
  value: T
  msg?: string
  skipNext?: boolean
}

export type ErrorMsgParams = Record<`:${string}`, string>

export interface ParsedRule<T = unknown> {
  check: boolean
  value: T
  msg: string
  skipNext?: boolean
  params?: ErrorMsgParams
}

export interface ValidationErrors {
  maxNumber: string
  minNumber: string
  betweenNumber: string
  biggerNumber: string
  lowerNumber: string
  withinNumber: string
  maxString: string
  minString: string
  betweenString: string
  minArray: string
  maxArray: string
  betweenArray: string
  in: string
  notIn: string
  email: string
  phone: string
  url: string
  uuid: string
  ulid: string
  date: string
  time: string
  datetime: string
  numeric: string
  integer: string
  type: string
  regex: string
  regex_patterns: string
  required: string
  nullable: string
  sometimes: string
  before: string
  beforeOrEqual: string
  after: string
  afterOrEqual: string
  invalid: string
}

export interface ParseOptions<T> {
  value: T
  msg?: string
  errors: ValidationErrors
}

export type I18nLang = 'en' | 'it'

export interface I18nValidation {
  lang: I18nLang
  messages?: Record<string, Record<I18nLang, string>>
  params?: Record<`:${string}`, string | Record<I18nLang, string>>
}

export interface Ctx<T extends object> {
  request: { headers: any }
  args: Partial<T>
  stash: Record<string, any>
}

type ArrayKeys<T extends unknown[]>
  = T extends [unknown, ...unknown[]]
    ? T extends Record<infer Index, unknown>
      ? Index extends `${number}`
        ? Index | '*'
        : never
      : never
    : `${number}` | '*'

type ObjectKeys<T extends object>
  = T extends unknown[]
    ? ArrayKeys<T>
    : keyof T & string

interface HasConstructor {
  new (...args: unknown[]): unknown
}

export type NestedKeyOf<T> = T extends Record<infer Key, unknown>
  ? T extends HasConstructor
    ? never
    : T extends CallableFunction
      ? never
      : Key extends string | number
        ? (ObjectKeys<T> | (T[Key] extends object
            ? `${ObjectKeys<Pick<T, Key>>}.${NestedKeyOf<T[Key]>}`
            : T extends unknown[]
              ? T extends [unknown, ...unknown[]]
                ? never
                : T[number] extends object
                  ? `${number}.${NestedKeyOf<T[number]>}`
                  : never
              : never))
        : never
  : never
