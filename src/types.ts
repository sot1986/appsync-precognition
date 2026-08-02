export { }

export interface AppSyncErrorItem {
  message: string
  errorType?: string
  errorInfo?: Record<string, any> | null
}

export interface AppSyncErrorResult {
  type: 'AppSyncError'
  errors: AppSyncErrorItem[]
  errorsCount: number
}

export interface AppSyncMappedError {
  toErrorResult: () => AppSyncErrorResult
}

export type FullRule
  = 'required'
    | 'sometimes'
    | 'nullable'
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
    | 'unique'
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
  /** :attr must contain unique values */
  unique: string
  /** :attr is not valid */
  invalid: string
}

export interface ParseOptions<T> {
  value: T
  msg?: string
  errors: ValidationErrors
}

export interface I18n<T extends { [key in keyof T]: T[key] }, TLocale extends string> {
  locale: TLocale
  errors?: Record<string, Partial<ValidationErrors>>
  attributes?: Record<string, Partial<Record<`:${NestedKeyOf<T>}`, string>>>
}

type ArrayKeys<T extends unknown[]>
  = T extends [unknown, ...unknown[]]
    ? T extends Record<infer Index, unknown>
      ? Index extends `${number}`
        ? Index | '*'
        : never
      : never
    : `${number}` | '*'

type ObjectKeys<T extends object | null | undefined>
  = T extends unknown[]
    ? ArrayKeys<T>
    : keyof T & string

interface HasConstructor {
  new (...args: unknown[]): unknown
}

export type NestedKeyOf<T> = T extends Partial<{ [key in infer Key]: unknown }>
  ? T extends HasConstructor
    ? never
    : T extends CallableFunction
      ? never
      : Key extends string | number
        ? (ObjectKeys<T>
          | (
              T[Key] extends object | null | undefined
                ? `${ObjectKeys<Pick<T, Key>>}.${NestedKeyOf<T[Key]>}`
                : T extends unknown[]
                  ? T extends [unknown, ...unknown[]]
                    ? never
                    : T[number] extends object
                      ? `${number}.${NestedKeyOf<T[number]>}` | `*.${NestedKeyOf<T[number]>}`
                      : never
                  : never
            )
          )
        : never
  : never

export interface Ctx<
  T extends { [key in keyof T]: T[key] },
> {
  args: T
  arguments: T
  stash: Record<string, any>
  request: {
    headers: Record<string, string>
  }
}

export interface PrecognitionOptions<TInput> {
  /**
   * The validator function.
   * Receives the event data and returns the validated data.
   * If validation fails, it should throw an error that can be converted to validation errors.
   */
  validator: (event: TInput) => TInput | Promise<TInput>
  /**
   * Converts an error to validation errors.
   * If returns `null` or `undefined`, the error will propagate as is.
   */
  toValidationErrors?: (error: Error) => {
    message: string
    errors: Record<string, string | string[]>
  } | null | undefined
  /**
   * Returns the headers of the request event.
   * Default to checking for `event.request.headers` and `event.headers`.
   */
  resolveRequestHeaders?: (event: TInput) => Record<string, string>
  /**
   * The name of the precognition header.
   * Defaults to `'Precognition'`.
   */
  headerName?: string
  /**
   * The name of the validate only header.
   * Defaults to `'Precognition-Validate-Only'`.
   */
  validateOnlyHeaderName?: string
  /**
   * The name of the success header.
   * Defaults to `'Precognition-Success'`.
   */
  successHeaderName?: string
  /**
   * The status code to return for successful precognition requests.
   * Defaults to `204`.
   */
  statusCode?: number
}
