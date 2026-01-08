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
  /** :attr max value is :max */
  maxNumber: string
  /** :attr min value is :min */
  minNumber: string
  /** :attr value must be between :min and :max */
  betweenNumber: string
  /** :attr must be bigger than :min */
  biggerNumber: string
  /** :attr must be lower than :max */
  lowerNumber: string
  /** :attr must be within :min and :max */
  withinNumber: string
  /** :attr must not exceed :max characters */
  maxString: string
  /** :attr must have at least :min characters */
  minString: string
  /** :attr must have between :min and :max characters */
  betweenString: string
  /** :attr must have at least :min elements */
  minArray: string
  /** :attr must have at most :max elements */
  maxArray: string
  /** :attr must have between :min and :max elements */
  betweenArray: string
  /** :attr must be one of the specified values: :in */
  in: string
  /** :attr must not be one of this list: :notIn */
  notIn: string
  /** :attr must be a valid email address (name@domain.com) */
  email: string
  /** :attr must be a valid phone number (+123...) */
  phone: string
  /** :attr must be a valid URL (:pattern) */
  url: string
  /** :attr must be a valid UUID (:pattern) */
  uuid: string
  /** :attr must be a valid ULID (:pattern) */
  ulid: string
  /** :attr must be a valid date (:pattern) */
  date: string
  /** :attr must be a valid time (:pattern) */
  time: string
  /** :attr must be a valid datetime (:pattern) */
  datetime: string
  /** :attr must be a valid number (:pattern) */
  numeric: string
  /** :attr must be a valid integer (:pattern) */
  integer: string
  /** :attr is not valid :type */
  type: string
  /** :attr must match :pattern */
  regex: string
  /** attr: must match any of :patterns */
  regex_patterns: string
  /** :attr is required */
  required: string
  /** :attr is nullable */
  nullable: string
  /** :attr cannot be null */
  sometimes: string
  /** :attr must be before :before */
  before: string
  /** :attr must be before or equal to :beforeOrEqual */
  beforeOrEqual: string
  /** :attr must be after :after */
  after: string
  /** :attr must be after or equal to :afterOrEqual */
  afterOrEqual: string
  /** :attr is not valid */
  invalid: string
}

export interface ParseOptions<T> {
  value: T
  msg?: string
  errors: ValidationErrors
}

export interface Ctx<T extends object> {
  request: { headers: any }
  args: T
  stash: Record<string, any>
}

export interface I18n<T extends object, TLocale extends string> {
  locale: TLocale
  errors?: Record<string, Partial<ValidationErrors>>
  attributes?: Record<string, Partial<Record<`:${NestedKeyOf<T>}`, string>>>
}

export type LocalizedCtx<T extends object, TLocale extends string> = Ctx<T> & {
  stash: {
    __i18n: I18n<T, TLocale>
  }
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
                  ? `${number}.${NestedKeyOf<T[number]>}` | `*.${NestedKeyOf<T[number]>}`
                  : never
              : never))
        : never
  : never
