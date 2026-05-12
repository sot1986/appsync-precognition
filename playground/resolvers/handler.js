import { util } from '@aws-appsync/utils'

// #region ../dist/utils.js
function isArray(e) {
  return typeof e === `object` && !!e && typeof e?.length === `number`
}
function getNestedValue(p, m) {
  return m.split(`.`).reduce((p$1, m$1) => util.matches(`^\\d+$`, m$1) ? p$1[toNumber(m$1)] : p$1[m$1], p)
}
function setNestedValue(e, p, h) {
  const g = p.split(`.`)
  if (g.length === 1) {
    e[g[0]] = h
    return
  }
  const _ = g.pop()
  const v = getNestedValue(e, g.join(`.`))
  if (typeof v === `object` && !!v)
    v[_] = h
}
function cleanString(e, p) {
  if (p?.trim === false)
    return e
  const m = e.trim()
  if (p?.allowEmptyString)
    return m
  return m === `` ? null : m
}
function toNumber(p) {
  switch (true) {
    case util.matches(`^(-|\\+)?\\d+(\\.\\d+)?$`, p): return +p
    case util.matches(`^(-|\\+)?Infinity$`, p): return +p
    default: util.error(`Invalid number: ${p}`)
  }
}
const uuid = `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
const ulid = `^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$`
const url = `^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$|^https?:\\/\\/(localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?(\\/.*)?$`
const email = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$`
const phone = `^\\+[1-9]\\d{1,20}$`
const date = `^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$`
const time = `^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,6})?Z?$`
const datetime = `^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])T([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,6})?Z$`
const numeric = `^-?\\d+(\\.\\d+)?$`
const integer = `^-?\\d+$`
const baseErrors = {
  maxNumber: `:attr max value is :max`,
  minNumber: `:attr min value is :min`,
  betweenNumber: `:attr value must be between :min and :max`,
  biggerNumber: `:attr must be bigger than :min`,
  lowerNumber: `:attr must be lower than :max`,
  withinNumber: `:attr must be within :min and :max`,
  maxString: `:attr must not exceed :max characters`,
  minString: `:attr must have at least :min characters`,
  betweenString: `:attr must have between :min and :max characters`,
  minArray: `:attr must have at least :min elements`,
  maxArray: `:attr must have at most :max elements`,
  betweenArray: `:attr must have between :min and :max elements`,
  in: `:attr must be one of the specified values: :in`,
  notIn: `:attr must not be one of this list: :notIn`,
  email: `:attr must be a valid email address (name@domain.com)`,
  phone: `:attr must be a valid phone number (+123...)`,
  url: `:attr must be a valid URL (:pattern)`,
  uuid: `:attr must be a valid UUID (:pattern)`,
  ulid: `:attr must be a valid ULID (:pattern)`,
  date: `:attr must be a valid date (:pattern)`,
  time: `:attr must be a valid time (:pattern)`,
  datetime: `:attr must be a valid datetime (:pattern)`,
  numeric: `:attr must be a valid number (:pattern)`,
  integer: `:attr must be a valid integer (:pattern)`,
  type: `:attr is not valid :type`,
  regex: `:attr must match :pattern`,
  regex_patterns: `attr: must match any of :patterns`,
  required: `:attr is required`,
  nullable: `:attr is nullable`,
  sometimes: `:attr cannot be null`,
  before: `:attr must be before :before`,
  beforeOrEqual: `:attr must be before or equal to :beforeOrEqual`,
  after: `:attr must be after :after`,
  afterOrEqual: `:attr must be after or equal to :afterOrEqual`,
  invalid: `:attr is not valid`,
}
function parseErrorMessage(e, p) {
  let m = e
  Object.entries(p ?? {}).forEach(([e$1, p$1]) => {
    m = m.replaceAll(e$1, p$1)
  })
  return m
}

// #endregion
// #region ../dist/index.js
function parse(c, A) {
  const [P, ...F] = typeof A === `string` ? [A, void 0] : isArray(A) ? [A[0], ...A.slice(1)] : typeof A.rule === `string` ? [A.rule, void 0] : [A.rule[0], ...A.rule.slice(1)]
  switch (P) {
    case `required`: return requiredRule(c)
    case `nullable`: return nullableRule(c)
    case `sometimes`: return sometimesRule(c)
    case `min`:
    case `bigger`: return betweenRule(c, F[0], void 0, P === `bigger`)
    case `max`:
    case `lower`: return betweenRule(c, void 0, F[0], P === `lower`)
    case `between`:
    case `within`: return betweenRule(c, F[0], F[1], P === `within`)
    case `regex`: return regexRule(c, ...F)
    case `in`: return inRule(c, ...F)
    case `notIn`: return notInRule(c, ...F)
    case `before`:
    case `beforeOrEqual`: return beforeRule(c, F[0], P === `before`)
    case `after`:
    case `afterOrEqual`: return afterRule(c, F[0], P === `after`)
    case `email`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.email,
    }, email)
    case `phone`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.phone,
    }, phone)
    case `url`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.url,
    }, url)
    case `uuid`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.uuid,
    }, uuid)
    case `ulid`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.ulid,
    }, ulid)
    case `integer`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.integer,
    }, integer)
    case `date`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.date,
    }, date)
    case `time`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.time,
    }, time)
    case `datetime`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.datetime,
    }, datetime)
    case `numeric`: return regexRule({
      ...c,
      msg: c.msg ?? c.errors.numeric,
    }, numeric)
    default: return typeRule(c, P)
  }
}
function betweenRule({ value: c, msg: A, errors: j }, M = -Infinity, N = Infinity, P = false) {
  const [F, I] = [N === Infinity, M === -Infinity]
  const R = {
    check: false,
    msg: A ?? F ? P ? j.biggerNumber : j.minNumber : I ? P ? j.lowerNumber : j.maxNumber : P ? j.withinNumber : j.betweenNumber,
    value: c,
    params: {
      ':min': `${M}`,
      ':max': `${N}`,
    },
  }
  if (typeof c === `number`)
    R.check = P ? c > M && c < N : c >= M && c <= N
  if (typeof c === `string`) {
    R.check = c.length >= M && c.length <= N
    R.msg = A ?? F ? j.minString : I ? j.maxString : j.betweenString
  }
  if (isArray(c)) {
    R.check = c.length >= M && c.length <= N
    R.msg = A ?? F ? j.minArray : I ? j.maxArray : j.betweenArray
  }
  return R
}
function regexRule({ value: c, msg: A, errors: j }, ...M) {
  const N = {
    check: false,
    msg: A ?? (M.length === 1 ? j.regex : j.regex_patterns),
    value: c,
    params: M.length === 1 ? { ':pattern': M[0] } : { ':patterns': M.join(`, `) },
  }
  if (typeof c === `string`)
    N.check = M.some(A$1 => util.matches(A$1, c))
  if (typeof c === `number`)
    N.check = M.some(A$1 => util.matches(A$1, `${c}`))
  return N
}
function inRule({ value: c, msg: A, errors: j }, ...M) {
  return {
    check: M.includes(c),
    msg: A ?? j.in,
    value: c,
    params: { ':in': M.join(`, `) },
  }
}
function notInRule({ value: c, msg: A, errors: j }, ...M) {
  return {
    check: !M.includes(c),
    msg: A ?? j.notIn,
    value: c,
    params: { ':notIn': M.join(`, `) },
  }
}
function requiredRule({ value: c, msg: A, errors: j }) {
  const M = {
    check: true,
    msg: A ?? j.required,
    value: c,
    skipNext: true,
  }
  if (typeof c === `string`)
    M.check = c.length > 0
  if (isArray(c))
    M.check = c.length > 0
  if (typeof c === `number`)
    M.check = true
  if (typeof c === `boolean`)
    M.check = true
  if (typeof c === `object` && !M.value)
    M.check = false
  if (typeof c === `undefined`)
    M.check = false
  M.skipNext = !M.check
  return M
}
function nullableRule({ value: c, msg: A, errors: j }) {
  return {
    check: true,
    msg: A ?? j.nullable,
    value: c,
    skipNext: typeof c === `undefined` || c === null,
  }
}
function sometimesRule({ value: c, msg: A, errors: j }) {
  const M = {
    check: true,
    msg: A ?? j.sometimes,
    value: c,
  }
  if (typeof c === `undefined`) {
    M.skipNext = true
    return M
  }
  if (typeof c === `object` && !M.value) {
    M.check = false
    M.skipNext = true
    return M
  }
  return requiredRule({
    value: c,
    msg: A,
    errors: j,
  })
}
function typeRule({ value: c, msg: A, errors: j }, M) {
  const N = {
    check: false,
    msg: A ?? j.type,
    value: c,
    params: { ':type': M },
  }
  switch (M) {
    case `array`:
      N.check = isArray(c)
      break
    case `object`:
      N.check = typeof c === `object` && !!c && !isArray(c) && Object.keys(c).length > 0
      break
    case `boolean`:
      N.check = typeof c === `boolean`
      break
    case `number`:
      N.check = typeof c === `number`
      break
    default: N.check = typeof c === `string`
  }
  return N
}
function beforeRule({ value: c, msg: A, errors: j }, M, N = false) {
  const P = {
    check: false,
    msg: A ?? j.before,
    value: c,
    params: N ? { ':before': M } : { ':beforeOrEqual': M },
  }
  const F = util.time.parseISO8601ToEpochMilliSeconds(M)
  const I = typeof c === `string` ? util.time.parseISO8601ToEpochMilliSeconds(c) : c
  if (typeof I === `number`)
    P.check = N ? I < F : I <= F
  return P
}
function afterRule({ value: c, msg: A, errors: j }, M, N = false) {
  const P = {
    check: false,
    msg: A ?? N ? j.after : j.afterOrEqual,
    value: c,
    params: N ? { ':after': M } : { ':afterOrEqual': M },
  }
  const F = util.time.parseISO8601ToEpochMilliSeconds(M)
  const I = typeof c === `string` ? util.time.parseISO8601ToEpochMilliSeconds(c) : c
  if (typeof I === `number`)
    P.check = N ? I > F : I >= F
  return P
}
function isRule(c) {
  return typeof c === `object` && !!c && Object.hasOwn(c, `check`)
}
function isCustomFullRule(c) {
  return typeof c === `object` && !!c && Object.hasOwn(c, `rule`)
}
function validate(j, M, N) {
  let P = {}
  const I = {
    ...baseErrors,
    ...N?.errors,
  }
  sanitizeNestedArray(j, M)
  if (N?.attributes)
    sanitizeNestedArray(j, N.attributes)
  const L = JSON.parse(JSON.stringify(j))
  Object.keys(M).forEach((c) => {
    let j$1 = getNestedValue(L, c)
    if (typeof j$1 === `string`) {
      j$1 = cleanString(j$1, N)
      setNestedValue(L, c, j$1)
    }
    let R = false
    M[c]?.forEach((A) => {
      if (R)
        return
      const M$1 = isRule(A)
        ? {
            ...A,
            value: j$1,
            msg: A.msg ?? I.invalid,
          }
        : isCustomFullRule(A)
          ? parse({
              value: j$1,
              msg: A.msg,
              errors: I,
            }, A.rule)
          : parse({
              value: j$1,
              errors: I,
            }, A)
      R = !!M$1.skipNext || !M$1.check
      if (M$1.check)
        return
      if (P.msg)
        util.appendError(P.msg, P.errorType, P.data, P.errorInfo)
      M$1.params = M$1.params ?? {}
      if (util.matches(`:attr`, M$1.msg))
        M$1.params[`:attr`] = N?.attributes?.[`:${c}`] ?? formatAttributeName(c)
      P = {
        msg: parseErrorMessage(M$1.msg, M$1.params),
        errorType: `ValidationError`,
        data: null,
        errorInfo: {
          path: c,
          value: j$1,
        },
      }
    })
  })
  if (!P.msg)
    return L
  util.error(P.msg, P.errorType, P.data, P.errorInfo)
}
function sanitizeNestedArray(c, A) {
  Object.keys(A).forEach((j) => {
    const M = j.split(`.`)
    M.forEach((N, P) => {
      if (N !== `*` || P === 0)
        return
      const I = M.slice(0, P).join(`.`)
      const R = getNestedValue(c, I.startsWith(`:`) ? I.slice(1) : I)
      if (!isArray(R))
        return
      R.forEach((c$1, N$1) => {
        const F = [...M]
        F[P] = `${N$1}`
        A[F.join(`.`)] = A[j]
      })
      delete A[j]
    })
  })
}
function formatAttributeName(c) {
  return c.split(`.`).reduce((c$1, A) => {
    if (util.matches(`^\\d+$`, A))
      return c$1
    let j = ``
    A.split(``).forEach((c$2, A$1) => {
      if (A$1 !== 0 && util.matches(`[A-Z]`, c$2))
        j += ` `
      j += c$2.toLowerCase()
    })
    return c$1 ? `${c$1} ${j}` : j
  }, ``)
}

// #endregion
// #region resolvers/handler.ts
function request(ctx) {
  validate({
    name: ctx.arguments.name,
    age: ctx.arguments.age,
    email: ctx.arguments.email,
    address: {
      street: ctx.arguments.address?.street,
      city: ctx.arguments.address?.city,
      country: ctx.arguments.address?.country,
    },
  }, {
    'name': ['min:2', 'max:25'],
    'age': ['between:18,100'],
    'email': ['email'],
    'address.street': ['max:255'],
    'address.country': ['in:IT,FR,GB'],
  })
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ id: util.autoId() }),
    attributeValues: util.dynamodb.toMapValues({
      ...ctx.arguments,
      createdAt: util.time.nowISO8601(),
      updatedAt: util.time.nowISO8601(),
    }),
    condition: { expression: 'attribute_not_exists(id)' },
  }
}

// #endregion
export { request }
// # sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsIm5hbWVzIjpbIm0iLCJwIiwiZSIsIkEiLCJqIiwiTSIsIk4iLCJjIl0sInNvdXJjZXMiOlsiLi4vLi4vZGlzdC91dGlscy5qcyIsIi4uLy4uL2Rpc3QvaW5kZXguanMiLCJoYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydHt1dGlsfWZyb21cIkBhd3MtYXBwc3luYy91dGlsc1wiO2Z1bmN0aW9uIGlzQXJyYXkoZSl7cmV0dXJuIHR5cGVvZiBlPT09YG9iamVjdGAmJiEhZSYmdHlwZW9mIGU/Lmxlbmd0aD09PWBudW1iZXJgfWZ1bmN0aW9uIGdldE5lc3RlZFZhbHVlKHAsbSl7cmV0dXJuIG0uc3BsaXQoYC5gKS5yZWR1Y2UoKHAsbSk9PnV0aWwubWF0Y2hlcyhgXlxcXFxkKyRgLG0pP3BbdG9OdW1iZXIobSldOnBbbV0scCl9ZnVuY3Rpb24gc2V0TmVzdGVkVmFsdWUoZSxwLGgpe2NvbnN0IGc9cC5zcGxpdChgLmApO2lmKGcubGVuZ3RoPT09MSl7ZVtnWzBdXT1oO3JldHVybn1jb25zdCBfPWcucG9wKCk7Y29uc3Qgdj1nZXROZXN0ZWRWYWx1ZShlLGcuam9pbihgLmApKTtpZih0eXBlb2Ygdj09PWBvYmplY3RgJiYhIXYpdltfXT1ofWZ1bmN0aW9uIGdldEhlYWRlcihlLHApe2NvbnN0IG09ZS50b0xvd2VyQ2FzZSgpO2NvbnN0IGg9T2JqZWN0LmtleXMocC5yZXF1ZXN0LmhlYWRlcnMpLmZpbmQoZT0+ZS50b0xvd2VyQ2FzZSgpPT09bSk7cmV0dXJuIGg/cC5yZXF1ZXN0LmhlYWRlcnNbaF06bnVsbH1mdW5jdGlvbiBjbGVhblN0cmluZyhlLHApe2lmKHA/LnRyaW09PT1mYWxzZSlyZXR1cm4gZTtjb25zdCBtPWUudHJpbSgpO2lmKHA/LmFsbG93RW1wdHlTdHJpbmcpcmV0dXJuIG07cmV0dXJuIG09PT1gYD9udWxsOm19ZnVuY3Rpb24gdG9OdW1iZXIocCl7c3dpdGNoKHRydWUpe2Nhc2UgdXRpbC5tYXRjaGVzKGBeKC18XFxcXCspP1xcXFxkKyhcXFxcLlxcXFxkKyk/JGAscCk6cmV0dXJuK3A7Y2FzZSB1dGlsLm1hdGNoZXMoYF4oLXxcXFxcKyk/SW5maW5pdHkkYCxwKTpyZXR1cm4rcDtkZWZhdWx0OnV0aWwuZXJyb3IoYEludmFsaWQgbnVtYmVyOiAke3B9YCl9fWNvbnN0IHV1aWQ9YF5bMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXsxMn0kYDtjb25zdCB1bGlkPWBeWzAxMjM0NTY3ODlBQkNERUZHSEpLTU5QUVJTVFZXWFlaXXsyNn0kYDtjb25zdCB1cmw9YF5odHRwcz86XFxcXC9cXFxcLyh3d3dcXFxcLik/Wy1hLXpBLVowLTlAOiUuX1xcXFwrfiM9XXsxLDI1Nn1cXFxcLlthLXpBLVowLTkoKV17MSw2fVxcXFxiKFstYS16QS1aMC05KClAOiVfXFxcXCsufiM/Ji8vPV0qKSR8Xmh0dHBzPzpcXFxcL1xcXFwvKGxvY2FsaG9zdHxcXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9KSg6XFxcXGQrKT8oXFxcXC8uKik/JGA7Y29uc3QgZW1haWw9YF5bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcXFwuW2EtekEtWl17Mix9JGA7Y29uc3QgcGhvbmU9YF5cXFxcK1sxLTldXFxcXGR7MSwyMH0kYDtjb25zdCBkYXRlPWBeXFxcXGR7NH0tKDBbMS05XXwxWzAtMl0pLSgwWzEtOV18WzEyXVxcXFxkfDNbMDFdKSRgO2NvbnN0IHRpbWU9YF4oWzAxXVxcXFxkfDJbMC0zXSk6WzAtNV1cXFxcZDpbMC01XVxcXFxkKFxcXFwuXFxcXGR7MSw2fSk/Wj8kYDtjb25zdCBkYXRldGltZT1gXlxcXFxkezR9LSgwWzEtOV18MVswLTJdKS0oMFsxLTldfFsxMl1cXFxcZHwzWzAxXSlUKFswMV1cXFxcZHwyWzAtM10pOlswLTVdXFxcXGQ6WzAtNV1cXFxcZChcXFxcLlxcXFxkezEsNn0pP1okYDtjb25zdCBudW1lcmljPWBeLT9cXFxcZCsoXFxcXC5cXFxcZCspPyRgO2NvbnN0IGludGVnZXI9YF4tP1xcXFxkKyRgO2NvbnN0IGJhc2VFcnJvcnM9e21heE51bWJlcjpgOmF0dHIgbWF4IHZhbHVlIGlzIDptYXhgLG1pbk51bWJlcjpgOmF0dHIgbWluIHZhbHVlIGlzIDptaW5gLGJldHdlZW5OdW1iZXI6YDphdHRyIHZhbHVlIG11c3QgYmUgYmV0d2VlbiA6bWluIGFuZCA6bWF4YCxiaWdnZXJOdW1iZXI6YDphdHRyIG11c3QgYmUgYmlnZ2VyIHRoYW4gOm1pbmAsbG93ZXJOdW1iZXI6YDphdHRyIG11c3QgYmUgbG93ZXIgdGhhbiA6bWF4YCx3aXRoaW5OdW1iZXI6YDphdHRyIG11c3QgYmUgd2l0aGluIDptaW4gYW5kIDptYXhgLG1heFN0cmluZzpgOmF0dHIgbXVzdCBub3QgZXhjZWVkIDptYXggY2hhcmFjdGVyc2AsbWluU3RyaW5nOmA6YXR0ciBtdXN0IGhhdmUgYXQgbGVhc3QgOm1pbiBjaGFyYWN0ZXJzYCxiZXR3ZWVuU3RyaW5nOmA6YXR0ciBtdXN0IGhhdmUgYmV0d2VlbiA6bWluIGFuZCA6bWF4IGNoYXJhY3RlcnNgLG1pbkFycmF5OmA6YXR0ciBtdXN0IGhhdmUgYXQgbGVhc3QgOm1pbiBlbGVtZW50c2AsbWF4QXJyYXk6YDphdHRyIG11c3QgaGF2ZSBhdCBtb3N0IDptYXggZWxlbWVudHNgLGJldHdlZW5BcnJheTpgOmF0dHIgbXVzdCBoYXZlIGJldHdlZW4gOm1pbiBhbmQgOm1heCBlbGVtZW50c2AsaW46YDphdHRyIG11c3QgYmUgb25lIG9mIHRoZSBzcGVjaWZpZWQgdmFsdWVzOiA6aW5gLG5vdEluOmA6YXR0ciBtdXN0IG5vdCBiZSBvbmUgb2YgdGhpcyBsaXN0OiA6bm90SW5gLGVtYWlsOmA6YXR0ciBtdXN0IGJlIGEgdmFsaWQgZW1haWwgYWRkcmVzcyAobmFtZUBkb21haW4uY29tKWAscGhvbmU6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBwaG9uZSBudW1iZXIgKCsxMjMuLi4pYCx1cmw6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBVUkwgKDpwYXR0ZXJuKWAsdXVpZDpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIFVVSUQgKDpwYXR0ZXJuKWAsdWxpZDpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIFVMSUQgKDpwYXR0ZXJuKWAsZGF0ZTpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIGRhdGUgKDpwYXR0ZXJuKWAsdGltZTpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIHRpbWUgKDpwYXR0ZXJuKWAsZGF0ZXRpbWU6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBkYXRldGltZSAoOnBhdHRlcm4pYCxudW1lcmljOmA6YXR0ciBtdXN0IGJlIGEgdmFsaWQgbnVtYmVyICg6cGF0dGVybilgLGludGVnZXI6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBpbnRlZ2VyICg6cGF0dGVybilgLHR5cGU6YDphdHRyIGlzIG5vdCB2YWxpZCA6dHlwZWAscmVnZXg6YDphdHRyIG11c3QgbWF0Y2ggOnBhdHRlcm5gLHJlZ2V4X3BhdHRlcm5zOmBhdHRyOiBtdXN0IG1hdGNoIGFueSBvZiA6cGF0dGVybnNgLHJlcXVpcmVkOmA6YXR0ciBpcyByZXF1aXJlZGAsbnVsbGFibGU6YDphdHRyIGlzIG51bGxhYmxlYCxzb21ldGltZXM6YDphdHRyIGNhbm5vdCBiZSBudWxsYCxiZWZvcmU6YDphdHRyIG11c3QgYmUgYmVmb3JlIDpiZWZvcmVgLGJlZm9yZU9yRXF1YWw6YDphdHRyIG11c3QgYmUgYmVmb3JlIG9yIGVxdWFsIHRvIDpiZWZvcmVPckVxdWFsYCxhZnRlcjpgOmF0dHIgbXVzdCBiZSBhZnRlciA6YWZ0ZXJgLGFmdGVyT3JFcXVhbDpgOmF0dHIgbXVzdCBiZSBhZnRlciBvciBlcXVhbCB0byA6YWZ0ZXJPckVxdWFsYCxpbnZhbGlkOmA6YXR0ciBpcyBub3QgdmFsaWRgfTtmdW5jdGlvbiBwYXJzZUVycm9yTWVzc2FnZShlLHApe2xldCBtPWU7T2JqZWN0LmVudHJpZXMocD8/e30pLmZvckVhY2goKFtlLHBdKT0+e209bS5yZXBsYWNlQWxsKGUscCl9KTtyZXR1cm4gbX1leHBvcnR7YmFzZUVycm9ycyxjbGVhblN0cmluZyxkYXRlLGRhdGV0aW1lLGVtYWlsLGdldEhlYWRlcixnZXROZXN0ZWRWYWx1ZSxpbnRlZ2VyLGlzQXJyYXksbnVtZXJpYyxwYXJzZUVycm9yTWVzc2FnZSxwaG9uZSxzZXROZXN0ZWRWYWx1ZSx0aW1lLHRvTnVtYmVyLHVsaWQsdXJsLHV1aWR9OyIsImltcG9ydHtiYXNlRXJyb3JzLGNsZWFuU3RyaW5nLGRhdGUsZGF0ZXRpbWUsZW1haWwsZ2V0SGVhZGVyLGdldE5lc3RlZFZhbHVlLGludGVnZXIsaXNBcnJheSxudW1lcmljLHBhcnNlRXJyb3JNZXNzYWdlLHBob25lLHNldE5lc3RlZFZhbHVlLHRpbWUsdWxpZCx1cmwsdXVpZH1mcm9tXCIuL3V0aWxzLmpzXCI7aW1wb3J0e3J1bnRpbWUsdXRpbH1mcm9tXCJAYXdzLWFwcHN5bmMvdXRpbHNcIjtmdW5jdGlvbiBwYXJzZShjLEEpe2NvbnN0W1AsLi4uRl09dHlwZW9mIEE9PT1gc3RyaW5nYD9bQSx2b2lkIDBdOmlzQXJyYXkoQSk/W0FbMF0sLi4uQS5zbGljZSgxKV06dHlwZW9mIEEucnVsZT09PWBzdHJpbmdgP1tBLnJ1bGUsdm9pZCAwXTpbQS5ydWxlWzBdLC4uLkEucnVsZS5zbGljZSgxKV07c3dpdGNoKFApe2Nhc2VgcmVxdWlyZWRgOnJldHVybiByZXF1aXJlZFJ1bGUoYyk7Y2FzZWBudWxsYWJsZWA6cmV0dXJuIG51bGxhYmxlUnVsZShjKTtjYXNlYHNvbWV0aW1lc2A6cmV0dXJuIHNvbWV0aW1lc1J1bGUoYyk7Y2FzZWBtaW5gOmNhc2VgYmlnZ2VyYDpyZXR1cm4gYmV0d2VlblJ1bGUoYyxGWzBdLHZvaWQgMCxQPT09YGJpZ2dlcmApO2Nhc2VgbWF4YDpjYXNlYGxvd2VyYDpyZXR1cm4gYmV0d2VlblJ1bGUoYyx2b2lkIDAsRlswXSxQPT09YGxvd2VyYCk7Y2FzZWBiZXR3ZWVuYDpjYXNlYHdpdGhpbmA6cmV0dXJuIGJldHdlZW5SdWxlKGMsRlswXSxGWzFdLFA9PT1gd2l0aGluYCk7Y2FzZWByZWdleGA6cmV0dXJuIHJlZ2V4UnVsZShjLC4uLkYpO2Nhc2VgaW5gOnJldHVybiBpblJ1bGUoYywuLi5GKTtjYXNlYG5vdEluYDpyZXR1cm4gbm90SW5SdWxlKGMsLi4uRik7Y2FzZWBiZWZvcmVgOmNhc2VgYmVmb3JlT3JFcXVhbGA6cmV0dXJuIGJlZm9yZVJ1bGUoYyxGWzBdLFA9PT1gYmVmb3JlYCk7Y2FzZWBhZnRlcmA6Y2FzZWBhZnRlck9yRXF1YWxgOnJldHVybiBhZnRlclJ1bGUoYyxGWzBdLFA9PT1gYWZ0ZXJgKTtjYXNlYGVtYWlsYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi5jLG1zZzpjLm1zZz8/Yy5lcnJvcnMuZW1haWx9LGVtYWlsKTtjYXNlYHBob25lYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi5jLG1zZzpjLm1zZz8/Yy5lcnJvcnMucGhvbmV9LHBob25lKTtjYXNlYHVybGA6cmV0dXJuIHJlZ2V4UnVsZSh7Li4uYyxtc2c6Yy5tc2c/P2MuZXJyb3JzLnVybH0sdXJsKTtjYXNlYHV1aWRgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy51dWlkfSx1dWlkKTtjYXNlYHVsaWRgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy51bGlkfSx1bGlkKTtjYXNlYGludGVnZXJgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy5pbnRlZ2VyfSxpbnRlZ2VyKTtjYXNlYGRhdGVgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy5kYXRlfSxkYXRlKTtjYXNlYHRpbWVgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy50aW1lfSx0aW1lKTtjYXNlYGRhdGV0aW1lYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi5jLG1zZzpjLm1zZz8/Yy5lcnJvcnMuZGF0ZXRpbWV9LGRhdGV0aW1lKTtjYXNlYG51bWVyaWNgOnJldHVybiByZWdleFJ1bGUoey4uLmMsbXNnOmMubXNnPz9jLmVycm9ycy5udW1lcmljfSxudW1lcmljKTtkZWZhdWx0OnJldHVybiB0eXBlUnVsZShjLFApfX1mdW5jdGlvbiBiZXR3ZWVuUnVsZSh7dmFsdWU6Yyxtc2c6QSxlcnJvcnM6an0sTT0tSW5maW5pdHksTj1JbmZpbml0eSxQPWZhbHNlKXtjb25zdFtGLEldPVtOPT09SW5maW5pdHksTT09PS1JbmZpbml0eV07Y29uc3QgUj17Y2hlY2s6ZmFsc2UsbXNnOkE/P0Y/UD9qLmJpZ2dlck51bWJlcjpqLm1pbk51bWJlcjpJP1A/ai5sb3dlck51bWJlcjpqLm1heE51bWJlcjpQP2oud2l0aGluTnVtYmVyOmouYmV0d2Vlbk51bWJlcix2YWx1ZTpjLHBhcmFtczp7XCI6bWluXCI6YCR7TX1gLFwiOm1heFwiOmAke059YH19O2lmKHR5cGVvZiBjPT09YG51bWJlcmApUi5jaGVjaz1QP2M+TSYmYzxOOmM+PU0mJmM8PU47aWYodHlwZW9mIGM9PT1gc3RyaW5nYCl7Ui5jaGVjaz1jLmxlbmd0aD49TSYmYy5sZW5ndGg8PU47Ui5tc2c9QT8/Rj9qLm1pblN0cmluZzpJP2oubWF4U3RyaW5nOmouYmV0d2VlblN0cmluZ31pZihpc0FycmF5KGMpKXtSLmNoZWNrPWMubGVuZ3RoPj1NJiZjLmxlbmd0aDw9TjtSLm1zZz1BPz9GP2oubWluQXJyYXk6ST9qLm1heEFycmF5OmouYmV0d2VlbkFycmF5fXJldHVybiBSfWZ1bmN0aW9uIHJlZ2V4UnVsZSh7dmFsdWU6Yyxtc2c6QSxlcnJvcnM6an0sLi4uTSl7Y29uc3QgTj17Y2hlY2s6ZmFsc2UsbXNnOkE/PyhNLmxlbmd0aD09PTE/ai5yZWdleDpqLnJlZ2V4X3BhdHRlcm5zKSx2YWx1ZTpjLHBhcmFtczpNLmxlbmd0aD09PTE/e1wiOnBhdHRlcm5cIjpNWzBdfTp7XCI6cGF0dGVybnNcIjpNLmpvaW4oYCwgYCl9fTtpZih0eXBlb2YgYz09PWBzdHJpbmdgKU4uY2hlY2s9TS5zb21lKEE9PnV0aWwubWF0Y2hlcyhBLGMpKTtpZih0eXBlb2YgYz09PWBudW1iZXJgKU4uY2hlY2s9TS5zb21lKEE9PnV0aWwubWF0Y2hlcyhBLGAke2N9YCkpO3JldHVybiBOfWZ1bmN0aW9uIGluUnVsZSh7dmFsdWU6Yyxtc2c6QSxlcnJvcnM6an0sLi4uTSl7cmV0dXJue2NoZWNrOk0uaW5jbHVkZXMoYyksbXNnOkE/P2ouaW4sdmFsdWU6YyxwYXJhbXM6e1wiOmluXCI6TS5qb2luKGAsIGApfX19ZnVuY3Rpb24gbm90SW5SdWxlKHt2YWx1ZTpjLG1zZzpBLGVycm9yczpqfSwuLi5NKXtyZXR1cm57Y2hlY2s6IU0uaW5jbHVkZXMoYyksbXNnOkE/P2oubm90SW4sdmFsdWU6YyxwYXJhbXM6e1wiOm5vdEluXCI6TS5qb2luKGAsIGApfX19ZnVuY3Rpb24gcmVxdWlyZWRSdWxlKHt2YWx1ZTpjLG1zZzpBLGVycm9yczpqfSl7Y29uc3QgTT17Y2hlY2s6dHJ1ZSxtc2c6QT8/ai5yZXF1aXJlZCx2YWx1ZTpjLHNraXBOZXh0OnRydWV9O2lmKHR5cGVvZiBjPT09YHN0cmluZ2ApTS5jaGVjaz1jLmxlbmd0aD4wO2lmKGlzQXJyYXkoYykpTS5jaGVjaz1jLmxlbmd0aD4wO2lmKHR5cGVvZiBjPT09YG51bWJlcmApTS5jaGVjaz10cnVlO2lmKHR5cGVvZiBjPT09YGJvb2xlYW5gKU0uY2hlY2s9dHJ1ZTtpZih0eXBlb2YgYz09PWBvYmplY3RgJiYhTS52YWx1ZSlNLmNoZWNrPWZhbHNlO2lmKHR5cGVvZiBjPT09YHVuZGVmaW5lZGApTS5jaGVjaz1mYWxzZTtNLnNraXBOZXh0PSFNLmNoZWNrO3JldHVybiBNfWZ1bmN0aW9uIG51bGxhYmxlUnVsZSh7dmFsdWU6Yyxtc2c6QSxlcnJvcnM6an0pe3JldHVybntjaGVjazp0cnVlLG1zZzpBPz9qLm51bGxhYmxlLHZhbHVlOmMsc2tpcE5leHQ6dHlwZW9mIGM9PT1gdW5kZWZpbmVkYHx8Yz09PW51bGx9fWZ1bmN0aW9uIHNvbWV0aW1lc1J1bGUoe3ZhbHVlOmMsbXNnOkEsZXJyb3JzOmp9KXtjb25zdCBNPXtjaGVjazp0cnVlLG1zZzpBPz9qLnNvbWV0aW1lcyx2YWx1ZTpjfTtpZih0eXBlb2YgYz09PWB1bmRlZmluZWRgKXtNLnNraXBOZXh0PXRydWU7cmV0dXJuIE19aWYodHlwZW9mIGM9PT1gb2JqZWN0YCYmIU0udmFsdWUpe00uY2hlY2s9ZmFsc2U7TS5za2lwTmV4dD10cnVlO3JldHVybiBNfXJldHVybiByZXF1aXJlZFJ1bGUoe3ZhbHVlOmMsbXNnOkEsZXJyb3JzOmp9KX1mdW5jdGlvbiB0eXBlUnVsZSh7dmFsdWU6Yyxtc2c6QSxlcnJvcnM6an0sTSl7Y29uc3QgTj17Y2hlY2s6ZmFsc2UsbXNnOkE/P2oudHlwZSx2YWx1ZTpjLHBhcmFtczp7XCI6dHlwZVwiOk19fTtzd2l0Y2goTSl7Y2FzZWBhcnJheWA6Ti5jaGVjaz1pc0FycmF5KGMpO2JyZWFrO2Nhc2Vgb2JqZWN0YDpOLmNoZWNrPXR5cGVvZiBjPT09YG9iamVjdGAmJiEhYyYmIWlzQXJyYXkoYykmJk9iamVjdC5rZXlzKGMpLmxlbmd0aD4wO2JyZWFrO2Nhc2VgYm9vbGVhbmA6Ti5jaGVjaz10eXBlb2YgYz09PWBib29sZWFuYDticmVhaztjYXNlYG51bWJlcmA6Ti5jaGVjaz10eXBlb2YgYz09PWBudW1iZXJgO2JyZWFrO2RlZmF1bHQ6Ti5jaGVjaz10eXBlb2YgYz09PWBzdHJpbmdgfXJldHVybiBOfWZ1bmN0aW9uIGJlZm9yZVJ1bGUoe3ZhbHVlOmMsbXNnOkEsZXJyb3JzOmp9LE0sTj1mYWxzZSl7Y29uc3QgUD17Y2hlY2s6ZmFsc2UsbXNnOkE/P2ouYmVmb3JlLHZhbHVlOmMscGFyYW1zOk4/e1wiOmJlZm9yZVwiOk19OntcIjpiZWZvcmVPckVxdWFsXCI6TX19O2NvbnN0IEY9dXRpbC50aW1lLnBhcnNlSVNPODYwMVRvRXBvY2hNaWxsaVNlY29uZHMoTSk7Y29uc3QgST10eXBlb2YgYz09PWBzdHJpbmdgP3V0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKGMpOmM7aWYodHlwZW9mIEk9PT1gbnVtYmVyYClQLmNoZWNrPU4/STxGOkk8PUY7cmV0dXJuIFB9ZnVuY3Rpb24gYWZ0ZXJSdWxlKHt2YWx1ZTpjLG1zZzpBLGVycm9yczpqfSxNLE49ZmFsc2Upe2NvbnN0IFA9e2NoZWNrOmZhbHNlLG1zZzpBPz9OP2ouYWZ0ZXI6ai5hZnRlck9yRXF1YWwsdmFsdWU6YyxwYXJhbXM6Tj97XCI6YWZ0ZXJcIjpNfTp7XCI6YWZ0ZXJPckVxdWFsXCI6TX19O2NvbnN0IEY9dXRpbC50aW1lLnBhcnNlSVNPODYwMVRvRXBvY2hNaWxsaVNlY29uZHMoTSk7Y29uc3QgST10eXBlb2YgYz09PWBzdHJpbmdgP3V0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKGMpOmM7aWYodHlwZW9mIEk9PT1gbnVtYmVyYClQLmNoZWNrPU4/ST5GOkk+PUY7cmV0dXJuIFB9ZnVuY3Rpb24gaXNSdWxlKGMpe3JldHVybiB0eXBlb2YgYz09PWBvYmplY3RgJiYhIWMmJk9iamVjdC5oYXNPd24oYyxgY2hlY2tgKX1mdW5jdGlvbiBpc0N1c3RvbUZ1bGxSdWxlKGMpe3JldHVybiB0eXBlb2YgYz09PWBvYmplY3RgJiYhIWMmJk9iamVjdC5oYXNPd24oYyxgcnVsZWApfWZ1bmN0aW9uIHZhbGlkYXRlKGosTSxOKXtsZXQgUD17fTtjb25zdCBJPXsuLi5iYXNlRXJyb3JzLC4uLk4/LmVycm9yc307c2FuaXRpemVOZXN0ZWRBcnJheShqLE0pO2lmKE4/LmF0dHJpYnV0ZXMpc2FuaXRpemVOZXN0ZWRBcnJheShqLE4uYXR0cmlidXRlcyk7Y29uc3QgTD1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGopKTtPYmplY3Qua2V5cyhNKS5mb3JFYWNoKGM9PntsZXQgaj1nZXROZXN0ZWRWYWx1ZShMLGMpO2lmKHR5cGVvZiBqPT09YHN0cmluZ2Ape2o9Y2xlYW5TdHJpbmcoaixOKTtzZXROZXN0ZWRWYWx1ZShMLGMsail9bGV0IFI9ZmFsc2U7TVtjXT8uZm9yRWFjaChBPT57aWYoUilyZXR1cm47Y29uc3QgTT1pc1J1bGUoQSk/ey4uLkEsdmFsdWU6aixtc2c6QS5tc2c/P0kuaW52YWxpZH06aXNDdXN0b21GdWxsUnVsZShBKT9wYXJzZSh7dmFsdWU6aixtc2c6QS5tc2csZXJyb3JzOkl9LEEucnVsZSk6cGFyc2Uoe3ZhbHVlOmosZXJyb3JzOkl9LEEpO1I9ISFNLnNraXBOZXh0fHwhTS5jaGVjaztpZihNLmNoZWNrKXJldHVybjtpZihQLm1zZyl1dGlsLmFwcGVuZEVycm9yKFAubXNnLFAuZXJyb3JUeXBlLFAuZGF0YSxQLmVycm9ySW5mbyk7TS5wYXJhbXM9TS5wYXJhbXM/P3t9O2lmKHV0aWwubWF0Y2hlcyhgOmF0dHJgLE0ubXNnKSlNLnBhcmFtc1tgOmF0dHJgXT1OPy5hdHRyaWJ1dGVzPy5bYDoke2N9YF0/P2Zvcm1hdEF0dHJpYnV0ZU5hbWUoYyk7UD17bXNnOnBhcnNlRXJyb3JNZXNzYWdlKE0ubXNnLE0ucGFyYW1zKSxlcnJvclR5cGU6YFZhbGlkYXRpb25FcnJvcmAsZGF0YTpudWxsLGVycm9ySW5mbzp7cGF0aDpjLHZhbHVlOmp9fX0pfSk7aWYoIVAubXNnKXJldHVybiBMO3V0aWwuZXJyb3IoUC5tc2csUC5lcnJvclR5cGUsUC5kYXRhLFAuZXJyb3JJbmZvKX1mdW5jdGlvbiBzYW5pdGl6ZU5lc3RlZEFycmF5KGMsQSl7T2JqZWN0LmtleXMoQSkuZm9yRWFjaChqPT57Y29uc3QgTT1qLnNwbGl0KGAuYCk7TS5mb3JFYWNoKChOLFApPT57aWYoTiE9PWAqYHx8UD09PTApcmV0dXJuO2NvbnN0IEk9TS5zbGljZSgwLFApLmpvaW4oYC5gKTtjb25zdCBSPWdldE5lc3RlZFZhbHVlKGMsSS5zdGFydHNXaXRoKGA6YCk/SS5zbGljZSgxKTpJKTtpZighaXNBcnJheShSKSlyZXR1cm47Ui5mb3JFYWNoKChjLE4pPT57Y29uc3QgRj1bLi4uTV07RltQXT1gJHtOfWA7QVtGLmpvaW4oYC5gKV09QVtqXX0pO2RlbGV0ZSBBW2pdfSl9KX1mdW5jdGlvbiBwcmVjb2duaXRpdmVWYWxpZGF0aW9uKGMsQSxqKXtjb25zdHtlcnJvcnM6TSxhdHRyaWJ1dGVzOk59PWlzTG9jYWxpemVkKGMpP3tlcnJvcnM6ey4uLmMuc3Rhc2guX19pMThuLmVycm9ycywuLi5qPy5lcnJvcnN9LGF0dHJpYnV0ZXM6ey4uLmMuc3Rhc2guX19pMThuLmF0dHJpYnV0ZXMsLi4uaj8uYXR0cmlidXRlc319OntlcnJvcnM6aj8uZXJyb3JzLGF0dHJpYnV0ZXM6aj8uYXR0cmlidXRlc307aWYoZ2V0SGVhZGVyKGBwcmVjb2duaXRpb25gLGMpIT09YHRydWVgKXJldHVybiBjLnN0YXNoLl9fdmFsaWRhdGVkPXZhbGlkYXRlKGMuYXJncyxBLHsuLi5qLGVycm9yczpNLGF0dHJpYnV0ZXM6Tn0pO2NvbnN0IEY9Z2V0SGVhZGVyKGBQcmVjb2duaXRpb24tVmFsaWRhdGUtT25seWAsYyk/LnNwbGl0KGAsYCkubWFwKGM9PmMudHJpbSgpKTt1dGlsLmh0dHAuYWRkUmVzcG9uc2VIZWFkZXIoYFByZWNvZ25pdGlvbmAsYHRydWVgKTtpZighRil7Yy5zdGFzaC5fX3ZhbGlkYXRlZD12YWxpZGF0ZShjLmFyZ3MsQSx7Li4uaixlcnJvcnM6TSxhdHRyaWJ1dGVzOk59KTt1dGlsLmh0dHAuYWRkUmVzcG9uc2VIZWFkZXIoYFByZWNvZ25pdGlvbi1TdWNjZXNzYCxgdHJ1ZWApO3J1bnRpbWUuZWFybHlSZXR1cm4obnVsbCl9dXRpbC5odHRwLmFkZFJlc3BvbnNlSGVhZGVyKGBQcmVjb2duaXRpb24tVmFsaWRhdGUtT25seWAsRi5qb2luKGAsYCkpO2NvbnN0IEk9e307Ri5mb3JFYWNoKGM9PntJW2NdPUFbY119KTtjLnN0YXNoLl9fdmFsaWRhdGVkPXZhbGlkYXRlKGMuYXJncyxJLHsuLi5qLGVycm9yczpNLGF0dHJpYnV0ZXM6Tn0pO3V0aWwuaHR0cC5hZGRSZXNwb25zZUhlYWRlcihgUHJlY29nbml0aW9uLVN1Y2Nlc3NgLGB0cnVlYCk7cnVudGltZS5lYXJseVJldHVybihudWxsLHtza2lwVG86aj8uc2tpcFRvPz9gRU5EYH0pfWZ1bmN0aW9uIGZvcm1hdEF0dHJpYnV0ZU5hbWUoYyl7cmV0dXJuIGMuc3BsaXQoYC5gKS5yZWR1Y2UoKGMsQSk9PntpZih1dGlsLm1hdGNoZXMoYF5cXFxcZCskYCxBKSlyZXR1cm4gYztsZXQgaj1gYDtBLnNwbGl0KGBgKS5mb3JFYWNoKChjLEEpPT57aWYoQSE9PTAmJnV0aWwubWF0Y2hlcyhgW0EtWl1gLGMpKWorPWAgYDtqKz1jLnRvTG93ZXJDYXNlKCl9KTtyZXR1cm4gYz9gJHtjfSAke2p9YDpqfSxgYCl9ZnVuY3Rpb24gYXNzZXJ0VmFsaWRhdGVkKGMpe2lmKE9iamVjdC5oYXNPd24oYy5zdGFzaCxgX192YWxpZGF0ZWRgKSlyZXR1cm47dXRpbC5lcnJvcihgQ29udGV4dCBhcmd1bWVudHMgaGF2ZSBub3QgYmVlbiB2YWxpZGF0ZWRgKX1mdW5jdGlvbiBpc0xvY2FsaXplZChjLEEpe2lmKE9iamVjdC5oYXNPd24oYy5zdGFzaCxgX19pMThuYCkmJnR5cGVvZiBjLnN0YXNoPy5fX2kxOG4ubG9jYWxlPT09YHN0cmluZ2ApcmV0dXJuIEE/Yy5zdGFzaC5fX2kxOG4ubG9jYWxlPT09QTp0cnVlO3JldHVybiBmYWxzZX1mdW5jdGlvbiBhc3NlcnRMb2NhbGl6ZWQoYyxBKXtpZihpc0xvY2FsaXplZChjLEEpKXJldHVybjt1dGlsLmVycm9yKGBDb250ZXh0IGFyZ3VlbWVudHMgaGF2ZSBub3QgYmVlbiBsb2NhbGl6ZWRgKX1leHBvcnR7YXNzZXJ0TG9jYWxpemVkLGFzc2VydFZhbGlkYXRlZCxmb3JtYXRBdHRyaWJ1dGVOYW1lLGlzTG9jYWxpemVkLHByZWNvZ25pdGl2ZVZhbGlkYXRpb24sdmFsaWRhdGV9OyIsImltcG9ydCB0eXBlIHsgQ29udGV4dCB9IGZyb20gJ0Bhd3MtYXBwc3luYy91dGlscydcbmltcG9ydCB7IHV0aWwgfSBmcm9tICdAYXdzLWFwcHN5bmMvdXRpbHMnXG5pbXBvcnQgeyB2YWxpZGF0ZSB9IGZyb20gJ0Bzb3QxOTg2L2FwcHN5bmMtcHJlY29nbml0aW9uJ1xuXG5pbnRlcmZhY2UgVXNlciB7XG4gIG5hbWU6IHN0cmluZ1xuICBhZ2U6IG51bWJlclxuICBlbWFpbDogc3RyaW5nXG4gIGFkZHJlc3M/OiB7XG4gICAgc3RyZWV0OiBzdHJpbmdcbiAgICBjaXR5OiBzdHJpbmdcbiAgICBjb3VudHJ5OiBzdHJpbmdcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWVzdChjdHg6IENvbnRleHQ8VXNlcj4pIHtcbiAgdmFsaWRhdGUoe1xuICAgIG5hbWU6IGN0eC5hcmd1bWVudHMubmFtZSxcbiAgICBhZ2U6IGN0eC5hcmd1bWVudHMuYWdlLFxuICAgIGVtYWlsOiBjdHguYXJndW1lbnRzLmVtYWlsLFxuICAgIGFkZHJlc3M6IHtcbiAgICAgIHN0cmVldDogY3R4LmFyZ3VtZW50cy5hZGRyZXNzPy5zdHJlZXQsXG4gICAgICBjaXR5OiBjdHguYXJndW1lbnRzLmFkZHJlc3M/LmNpdHksXG4gICAgICBjb3VudHJ5OiBjdHguYXJndW1lbnRzLmFkZHJlc3M/LmNvdW50cnksXG4gICAgfSxcbiAgfSwge1xuICAgICduYW1lJzogWydtaW46MicsICdtYXg6MjUnXSxcbiAgICAnYWdlJzogWydiZXR3ZWVuOjE4LDEwMCddLFxuICAgICdlbWFpbCc6IFsnZW1haWwnXSxcbiAgICAnYWRkcmVzcy5zdHJlZXQnOiBbJ21heDoyNTUnXSxcbiAgICAnYWRkcmVzcy5jb3VudHJ5JzogWydpbjpJVCxGUixHQiddLFxuICB9KVxuXG4gIHJldHVybiB7XG4gICAgb3BlcmF0aW9uOiAnUHV0SXRlbScsXG4gICAga2V5OiB1dGlsLmR5bmFtb2RiLnRvTWFwVmFsdWVzKHtcbiAgICAgIGlkOiB1dGlsLmF1dG9JZCgpLFxuICAgIH0pLFxuICAgIGF0dHJpYnV0ZVZhbHVlczogdXRpbC5keW5hbW9kYi50b01hcFZhbHVlcyh7XG4gICAgICAuLi5jdHguYXJndW1lbnRzLFxuICAgICAgY3JlYXRlZEF0OiB1dGlsLnRpbWUubm93SVNPODYwMSgpLFxuICAgICAgdXBkYXRlZEF0OiB1dGlsLnRpbWUubm93SVNPODYwMSgpLFxuICAgIH0pLFxuICAgIGNvbmRpdGlvbjoge1xuICAgICAgZXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9ub3RfZXhpc3RzKGlkKScsXG4gICAgfSxcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7QUFBcUMsU0FBUyxRQUFRLEdBQUU7QUFBQyxRQUFPLE9BQU8sTUFBSSxZQUFVLENBQUMsQ0FBQyxLQUFHLE9BQU8sR0FBRyxXQUFTOztBQUFTLFNBQVMsZUFBZSxHQUFFLEdBQUU7QUFBQyxRQUFPLEVBQUUsTUFBTSxJQUFJLENBQUMsUUFBUSxLQUFFLFFBQUksS0FBSyxRQUFRLFVBQVNBLElBQUUsR0FBQ0MsSUFBRSxTQUFTRCxJQUFFLElBQUVDLElBQUVELE1BQUcsRUFBRTs7QUFBQyxTQUFTLGVBQWUsR0FBRSxHQUFFLEdBQUU7Q0FBQyxNQUFNLElBQUUsRUFBRSxNQUFNLElBQUk7QUFBQyxLQUFHLEVBQUUsV0FBUyxHQUFFO0FBQUMsSUFBRSxFQUFFLE1BQUk7QUFBRTs7Q0FBTyxNQUFNLElBQUUsRUFBRSxLQUFLO0NBQUMsTUFBTSxJQUFFLGVBQWUsR0FBRSxFQUFFLEtBQUssSUFBSSxDQUFDO0FBQUMsS0FBRyxPQUFPLE1BQUksWUFBVSxDQUFDLENBQUMsRUFBRSxHQUFFLEtBQUc7O0FBQXlKLFNBQVMsWUFBWSxHQUFFLEdBQUU7QUFBQyxLQUFHLEdBQUcsU0FBTyxNQUFNLFFBQU87Q0FBRSxNQUFNLElBQUUsRUFBRSxNQUFNO0FBQUMsS0FBRyxHQUFHLGlCQUFpQixRQUFPO0FBQUUsUUFBTyxNQUFJLEtBQUcsT0FBSzs7QUFBRSxTQUFTLFNBQVMsR0FBRTtBQUFDLFNBQU8sTUFBUDtFQUFhLEtBQUssS0FBSyxRQUFRLDRCQUEyQixFQUFFLENBQUMsUUFBTSxDQUFDO0VBQUUsS0FBSyxLQUFLLFFBQVEsc0JBQXFCLEVBQUUsQ0FBQyxRQUFNLENBQUM7RUFBRSxRQUFRLE1BQUssTUFBTSxtQkFBbUIsSUFBSTs7O0FBQUUsTUFBTSxPQUFLO0FBQWlFLE1BQU0sT0FBSztBQUEyQyxNQUFNLE1BQUk7QUFBc00sTUFBTSxRQUFNO0FBQW9ELE1BQU0sUUFBTTtBQUFzQixNQUFNLE9BQUs7QUFBa0QsTUFBTSxPQUFLO0FBQXVELE1BQU0sV0FBUztBQUFvRyxNQUFNLFVBQVE7QUFBcUIsTUFBTSxVQUFRO0FBQVcsTUFBTSxhQUFXO0NBQUMsV0FBVTtDQUEwQixXQUFVO0NBQTBCLGVBQWM7Q0FBNEMsY0FBYTtDQUFpQyxhQUFZO0NBQWdDLGNBQWE7Q0FBcUMsV0FBVTtDQUF3QyxXQUFVO0NBQTJDLGVBQWM7Q0FBbUQsVUFBUztDQUF5QyxVQUFTO0NBQXdDLGNBQWE7Q0FBaUQsSUFBRztDQUFpRCxPQUFNO0NBQTZDLE9BQU07Q0FBd0QsT0FBTTtDQUErQyxLQUFJO0NBQXVDLE1BQUs7Q0FBd0MsTUFBSztDQUF3QyxNQUFLO0NBQXdDLE1BQUs7Q0FBd0MsVUFBUztDQUE0QyxTQUFRO0NBQTBDLFNBQVE7Q0FBMkMsTUFBSztDQUEyQixPQUFNO0NBQTRCLGdCQUFlO0NBQW9DLFVBQVM7Q0FBb0IsVUFBUztDQUFvQixXQUFVO0NBQXVCLFFBQU87Q0FBK0IsZUFBYztDQUFrRCxPQUFNO0NBQTZCLGNBQWE7Q0FBZ0QsU0FBUTtDQUFxQjtBQUFDLFNBQVMsa0JBQWtCLEdBQUUsR0FBRTtDQUFDLElBQUksSUFBRTtBQUFFLFFBQU8sUUFBUSxLQUFHLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQ0UsS0FBRUQsU0FBSztBQUFDLE1BQUUsRUFBRSxXQUFXQyxLQUFFRCxJQUFFO0dBQUU7QUFBQyxRQUFPOzs7OztBQ0Fya0csU0FBUyxNQUFNLEdBQUUsR0FBRTtDQUFDLE1BQUssQ0FBQyxHQUFFLEdBQUcsS0FBRyxPQUFPLE1BQUksV0FBUyxDQUFDLEdBQUUsS0FBSyxFQUFFLEdBQUMsUUFBUSxFQUFFLEdBQUMsQ0FBQyxFQUFFLElBQUcsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUMsT0FBTyxFQUFFLFNBQU8sV0FBUyxDQUFDLEVBQUUsTUFBSyxLQUFLLEVBQUUsR0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFHLEdBQUcsRUFBRSxLQUFLLE1BQU0sRUFBRSxDQUFDO0FBQUMsU0FBTyxHQUFQO0VBQVUsS0FBSSxXQUFXLFFBQU8sYUFBYSxFQUFFO0VBQUMsS0FBSSxXQUFXLFFBQU8sYUFBYSxFQUFFO0VBQUMsS0FBSSxZQUFZLFFBQU8sY0FBYyxFQUFFO0VBQUMsS0FBSTtFQUFNLEtBQUksU0FBUyxRQUFPLFlBQVksR0FBRSxFQUFFLElBQUcsS0FBSyxHQUFFLE1BQUksU0FBUztFQUFDLEtBQUk7RUFBTSxLQUFJLFFBQVEsUUFBTyxZQUFZLEdBQUUsS0FBSyxHQUFFLEVBQUUsSUFBRyxNQUFJLFFBQVE7RUFBQyxLQUFJO0VBQVUsS0FBSSxTQUFTLFFBQU8sWUFBWSxHQUFFLEVBQUUsSUFBRyxFQUFFLElBQUcsTUFBSSxTQUFTO0VBQUMsS0FBSSxRQUFRLFFBQU8sVUFBVSxHQUFFLEdBQUcsRUFBRTtFQUFDLEtBQUksS0FBSyxRQUFPLE9BQU8sR0FBRSxHQUFHLEVBQUU7RUFBQyxLQUFJLFFBQVEsUUFBTyxVQUFVLEdBQUUsR0FBRyxFQUFFO0VBQUMsS0FBSTtFQUFTLEtBQUksZ0JBQWdCLFFBQU8sV0FBVyxHQUFFLEVBQUUsSUFBRyxNQUFJLFNBQVM7RUFBQyxLQUFJO0VBQVEsS0FBSSxlQUFlLFFBQU8sVUFBVSxHQUFFLEVBQUUsSUFBRyxNQUFJLFFBQVE7RUFBQyxLQUFJLFFBQVEsUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFNLEVBQUMsTUFBTTtFQUFDLEtBQUksUUFBUSxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQU0sRUFBQyxNQUFNO0VBQUMsS0FBSSxNQUFNLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBSSxFQUFDLElBQUk7RUFBQyxLQUFJLE9BQU8sUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFLLEVBQUMsS0FBSztFQUFDLEtBQUksT0FBTyxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQUssRUFBQyxLQUFLO0VBQUMsS0FBSSxVQUFVLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBUSxFQUFDLFFBQVE7RUFBQyxLQUFJLE9BQU8sUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFLLEVBQUMsS0FBSztFQUFDLEtBQUksT0FBTyxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQUssRUFBQyxLQUFLO0VBQUMsS0FBSSxXQUFXLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBUyxFQUFDLFNBQVM7RUFBQyxLQUFJLFVBQVUsUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFRLEVBQUMsUUFBUTtFQUFDLFFBQVEsUUFBTyxTQUFTLEdBQUUsRUFBRTs7O0FBQUUsU0FBUyxZQUFZLEVBQUMsT0FBTSxHQUFFLEtBQUksR0FBRSxRQUFPLEtBQUcsSUFBRSxXQUFVLElBQUUsVUFBUyxJQUFFLE9BQU07Q0FBQyxNQUFLLENBQUMsR0FBRSxLQUFHLENBQUMsTUFBSSxVQUFTLE1BQUksVUFBVTtDQUFDLE1BQU0sSUFBRTtFQUFDLE9BQU07RUFBTSxLQUFJLEtBQUcsSUFBRSxJQUFFLEVBQUUsZUFBYSxFQUFFLFlBQVUsSUFBRSxJQUFFLEVBQUUsY0FBWSxFQUFFLFlBQVUsSUFBRSxFQUFFLGVBQWEsRUFBRTtFQUFjLE9BQU07RUFBRSxRQUFPO0dBQUMsUUFBTyxHQUFHO0dBQUksUUFBTyxHQUFHO0dBQUk7RUFBQztBQUFDLEtBQUcsT0FBTyxNQUFJLFNBQVMsR0FBRSxRQUFNLElBQUUsSUFBRSxLQUFHLElBQUUsSUFBRSxLQUFHLEtBQUcsS0FBRztBQUFFLEtBQUcsT0FBTyxNQUFJLFVBQVM7QUFBQyxJQUFFLFFBQU0sRUFBRSxVQUFRLEtBQUcsRUFBRSxVQUFRO0FBQUUsSUFBRSxNQUFJLEtBQUcsSUFBRSxFQUFFLFlBQVUsSUFBRSxFQUFFLFlBQVUsRUFBRTs7QUFBYyxLQUFHLFFBQVEsRUFBRSxFQUFDO0FBQUMsSUFBRSxRQUFNLEVBQUUsVUFBUSxLQUFHLEVBQUUsVUFBUTtBQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsRUFBRSxXQUFTLElBQUUsRUFBRSxXQUFTLEVBQUU7O0FBQWEsUUFBTzs7QUFBRSxTQUFTLFVBQVUsRUFBQyxPQUFNLEdBQUUsS0FBSSxHQUFFLFFBQU8sS0FBRyxHQUFHLEdBQUU7Q0FBQyxNQUFNLElBQUU7RUFBQyxPQUFNO0VBQU0sS0FBSSxNQUFJLEVBQUUsV0FBUyxJQUFFLEVBQUUsUUFBTSxFQUFFO0VBQWdCLE9BQU07RUFBRSxRQUFPLEVBQUUsV0FBUyxJQUFFLEVBQUMsWUFBVyxFQUFFLElBQUcsR0FBQyxFQUFDLGFBQVksRUFBRSxLQUFLLEtBQUssRUFBQztFQUFDO0FBQUMsS0FBRyxPQUFPLE1BQUksU0FBUyxHQUFFLFFBQU0sRUFBRSxNQUFLLFFBQUcsS0FBSyxRQUFRRSxLQUFFLEVBQUUsQ0FBQztBQUFDLEtBQUcsT0FBTyxNQUFJLFNBQVMsR0FBRSxRQUFNLEVBQUUsTUFBSyxRQUFHLEtBQUssUUFBUUEsS0FBRSxHQUFHLElBQUksQ0FBQztBQUFDLFFBQU87O0FBQUUsU0FBUyxPQUFPLEVBQUMsT0FBTSxHQUFFLEtBQUksR0FBRSxRQUFPLEtBQUcsR0FBRyxHQUFFO0FBQUMsUUFBTTtFQUFDLE9BQU0sRUFBRSxTQUFTLEVBQUU7RUFBQyxLQUFJLEtBQUcsRUFBRTtFQUFHLE9BQU07RUFBRSxRQUFPLEVBQUMsT0FBTSxFQUFFLEtBQUssS0FBSyxFQUFDO0VBQUM7O0FBQUMsU0FBUyxVQUFVLEVBQUMsT0FBTSxHQUFFLEtBQUksR0FBRSxRQUFPLEtBQUcsR0FBRyxHQUFFO0FBQUMsUUFBTTtFQUFDLE9BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRTtFQUFDLEtBQUksS0FBRyxFQUFFO0VBQU0sT0FBTTtFQUFFLFFBQU8sRUFBQyxVQUFTLEVBQUUsS0FBSyxLQUFLLEVBQUM7RUFBQzs7QUFBQyxTQUFTLGFBQWEsRUFBQyxPQUFNLEdBQUUsS0FBSSxHQUFFLFFBQU8sS0FBRztDQUFDLE1BQU0sSUFBRTtFQUFDLE9BQU07RUFBSyxLQUFJLEtBQUcsRUFBRTtFQUFTLE9BQU07RUFBRSxVQUFTO0VBQUs7QUFBQyxLQUFHLE9BQU8sTUFBSSxTQUFTLEdBQUUsUUFBTSxFQUFFLFNBQU87QUFBRSxLQUFHLFFBQVEsRUFBRSxDQUFDLEdBQUUsUUFBTSxFQUFFLFNBQU87QUFBRSxLQUFHLE9BQU8sTUFBSSxTQUFTLEdBQUUsUUFBTTtBQUFLLEtBQUcsT0FBTyxNQUFJLFVBQVUsR0FBRSxRQUFNO0FBQUssS0FBRyxPQUFPLE1BQUksWUFBVSxDQUFDLEVBQUUsTUFBTSxHQUFFLFFBQU07QUFBTSxLQUFHLE9BQU8sTUFBSSxZQUFZLEdBQUUsUUFBTTtBQUFNLEdBQUUsV0FBUyxDQUFDLEVBQUU7QUFBTSxRQUFPOztBQUFFLFNBQVMsYUFBYSxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxLQUFHO0FBQUMsUUFBTTtFQUFDLE9BQU07RUFBSyxLQUFJLEtBQUcsRUFBRTtFQUFTLE9BQU07RUFBRSxVQUFTLE9BQU8sTUFBSSxlQUFhLE1BQUk7RUFBSzs7QUFBQyxTQUFTLGNBQWMsRUFBQyxPQUFNLEdBQUUsS0FBSSxHQUFFLFFBQU8sS0FBRztDQUFDLE1BQU0sSUFBRTtFQUFDLE9BQU07RUFBSyxLQUFJLEtBQUcsRUFBRTtFQUFVLE9BQU07RUFBRTtBQUFDLEtBQUcsT0FBTyxNQUFJLGFBQVk7QUFBQyxJQUFFLFdBQVM7QUFBSyxTQUFPOztBQUFFLEtBQUcsT0FBTyxNQUFJLFlBQVUsQ0FBQyxFQUFFLE9BQU07QUFBQyxJQUFFLFFBQU07QUFBTSxJQUFFLFdBQVM7QUFBSyxTQUFPOztBQUFFLFFBQU8sYUFBYTtFQUFDLE9BQU07RUFBRSxLQUFJO0VBQUUsUUFB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
