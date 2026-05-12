import { util } from '@aws-appsync/utils'

// #region ../dist/utils.js
function isArray(e) {
  return typeof e === `object` && !!e && typeof e?.length === `number`
}
function getNestedValue(p, m) {
  return m.split(`.`).reduce((p$1, m$1) => {
    return util.matches(`^\\d+$`, m$1) ? p$1[toNumber(m$1)] : p$1[m$1]
  }, p)
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
function parse(u, A) {
  const [P, ...F] = typeof A === `string` ? [A, void 0] : isArray(A) ? [A[0], ...A.slice(1)] : typeof A.rule === `string` ? [A.rule, void 0] : [A.rule[0], ...A.rule.slice(1)]
  switch (P) {
    case `required`: return requiredRule(u)
    case `nullable`: return nullableRule(u)
    case `sometimes`:
      util.error(`sometimes rule is not allowed here`)
      break
    case `min`:
    case `bigger`: return betweenRule(u, F[0], void 0, P === `bigger`)
    case `max`:
    case `lower`: return betweenRule(u, void 0, F[0], P === `lower`)
    case `between`:
    case `within`: return betweenRule(u, F[0], F[1], P === `within`)
    case `regex`: return regexRule(u, ...F)
    case `in`: return inRule(u, ...F)
    case `notIn`: return notInRule(u, ...F)
    case `before`:
    case `beforeOrEqual`: return beforeRule(u, F[0], P === `before`)
    case `after`:
    case `afterOrEqual`: return afterRule(u, F[0], P === `after`)
    case `email`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.email,
    }, email)
    case `phone`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.phone,
    }, phone)
    case `url`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.url,
    }, url)
    case `uuid`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.uuid,
    }, uuid)
    case `ulid`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.ulid,
    }, ulid)
    case `integer`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.integer,
    }, integer)
    case `date`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.date,
    }, date)
    case `time`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.time,
    }, time)
    case `datetime`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.datetime,
    }, datetime)
    case `numeric`: return regexRule({
      ...u,
      msg: u.msg ?? u.errors.numeric,
    }, numeric)
    default: return typeRule(u, P)
  }
}
function betweenRule({ value: u, msg: A, errors: j }, M = -Infinity, N = Infinity, P = false) {
  const [F, I] = [N === Infinity, M === -Infinity]
  const R = {
    check: false,
    msg: A ?? F ? P ? j.biggerNumber : j.minNumber : I ? P ? j.lowerNumber : j.maxNumber : P ? j.withinNumber : j.betweenNumber,
    value: u,
    params: {
      ':min': `${M}`,
      ':max': `${N}`,
    },
  }
  if (typeof u === `number`)
    R.check = P ? u > M && u < N : u >= M && u <= N
  if (typeof u === `string`) {
    R.check = u.length >= M && u.length <= N
    R.msg = A ?? F ? j.minString : I ? j.maxString : j.betweenString
  }
  if (isArray(u)) {
    R.check = u.length >= M && u.length <= N
    R.msg = A ?? F ? j.minArray : I ? j.maxArray : j.betweenArray
  }
  return R
}
function regexRule(u, ...A) {
  const j = {
    check: false,
    msg: u.msg ?? (A.length === 1 ? u.errors.regex : u.errors.regex_patterns),
    value: u.value,
    params: A.length === 1 ? { ':pattern': A[0] } : { ':patterns': A.join(`, `) },
  }
  if (typeof u.value === `string` || typeof u.value === `number`) {
    const M = typeof u.value === `string` ? u.value : `${u.value}`
    let N = false
    A.forEach((u$1) => {
      if (N || util.matches(u$1, M))
        N = true
    })
    j.check = N
  }
  return j
}
function inRule({ value: u, msg: A, errors: j }, ...M) {
  return {
    check: M.includes(u),
    msg: A ?? j.in,
    value: u,
    params: { ':in': M.join(`, `) },
  }
}
function notInRule({ value: u, msg: A, errors: j }, ...M) {
  return {
    check: !M.includes(u),
    msg: A ?? j.notIn,
    value: u,
    params: { ':notIn': M.join(`, `) },
  }
}
function requiredRule({ value: u, msg: A, errors: j }) {
  const M = {
    check: true,
    msg: A ?? j.required,
    value: u,
    skipNext: true,
  }
  if (typeof u === `string`)
    M.check = u.length > 0
  if (isArray(u))
    M.check = u.length > 0
  if (typeof u === `number`)
    M.check = true
  if (typeof u === `boolean`)
    M.check = true
  if (typeof u === `object` && !M.value)
    M.check = false
  if (typeof u === `undefined`)
    M.check = false
  M.skipNext = !M.check
  return M
}
function nullableRule({ value: u, msg: A, errors: j }) {
  return {
    check: true,
    msg: A ?? j.nullable,
    value: u,
    skipNext: typeof u === `undefined` || u === null,
  }
}
function sometimesRule({ value: u, msg: A, errors: j, parent: M, key: N }) {
  const P = {
    check: true,
    msg: A ?? j.sometimes,
    value: u,
  }
  if (!Object.hasOwn(M, N)) {
    P.skipNext = true
    return P
  }
  if (typeof u === `object` && !P.value) {
    P.check = false
    P.skipNext = true
    return P
  }
  return requiredRule({
    value: u,
    msg: A,
    errors: j,
  })
}
function typeRule({ value: u, msg: A, errors: j }, M) {
  const N = {
    check: false,
    msg: A ?? j.type,
    value: u,
    params: { ':type': M },
  }
  switch (M) {
    case `array`:
      N.check = isArray(u)
      break
    case `object`:
      N.check = typeof u === `object` && !!u && !isArray(u) && Object.keys(u).length > 0
      break
    case `boolean`:
      N.check = typeof u === `boolean`
      break
    case `number`:
      N.check = typeof u === `number`
      break
    default: N.check = typeof u === `string`
  }
  return N
}
function beforeRule({ value: u, msg: A, errors: j }, M, N = false) {
  const P = {
    check: false,
    msg: A ?? j.before,
    value: u,
    params: N ? { ':before': M } : { ':beforeOrEqual': M },
  }
  const F = util.time.parseISO8601ToEpochMilliSeconds(M)
  const I = typeof u === `string` ? util.time.parseISO8601ToEpochMilliSeconds(u) : u
  if (typeof I === `number`)
    P.check = N ? I < F : I <= F
  return P
}
function afterRule({ value: u, msg: A, errors: j }, M, N = false) {
  const P = {
    check: false,
    msg: A ?? N ? j.after : j.afterOrEqual,
    value: u,
    params: N ? { ':after': M } : { ':afterOrEqual': M },
  }
  const F = util.time.parseISO8601ToEpochMilliSeconds(M)
  const I = typeof u === `string` ? util.time.parseISO8601ToEpochMilliSeconds(u) : u
  if (typeof I === `number`)
    P.check = N ? I > F : I >= F
  return P
}
function isRule(u) {
  return typeof u === `object` && !!u && Object.hasOwn(u, `check`)
}
function isCustomFullRule(u) {
  return typeof u === `object` && !!u && Object.hasOwn(u, `rule`)
}
function validate(j, M, N) {
  let P = {}
  const I = {
    ...baseErrors,
    ...N?.errors,
  }
  if (typeof j !== `object`)
    util.error(`Object expected`)
  sanitizeNestedArray(j, M)
  if (N?.attributes)
    sanitizeNestedArray(j, N.attributes)
  const L = JSON.parse(JSON.stringify(j))
  Object.keys(M).forEach((u) => {
    let j$1 = getNestedValue(L, u)
    const R = u.split(`.`).length > 1 ? getNestedValue(L, u.split(`.`).slice(0, -1).join(`.`)) : L
    if (typeof j$1 === `string`) {
      j$1 = cleanString(j$1, N)
      setNestedValue(L, u, j$1)
    }
    let z = false
    const B = M[u]
    if (B?.length) {
      B.forEach((A) => {
        if (z)
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
            : A === `sometimes`
              ? sometimesRule({
                  value: j$1,
                  errors: I,
                  parent: R,
                  key: u.split(`.`).pop(),
                })
              : parse({
                  value: j$1,
                  errors: I,
                }, A)
        z = !!M$1.skipNext || !M$1.check
        if (M$1.check)
          return
        if (P.msg)
          appendValidationError(P.msg, { ...P.errorInfo })
        M$1.params = M$1.params ?? {}
        if (util.matches(`:attr`, M$1.msg))
          M$1.params[`:attr`] = N?.attributes?.[`:${u}`] ?? formatAttributeName(u)
        P = {
          msg: parseErrorMessage(M$1.msg, M$1.params),
          errorType: `ValidationError`,
          data: null,
          errorInfo: {
            path: u,
            value: j$1,
          },
        }
      })
    }
  })
  if (!P.msg)
    return L
  validationError(P.msg, { ...P.errorInfo })
}
function sanitizeNestedArray(u, A) {
  let j = []
  Object.keys(A).forEach((u$1) => {
    const A$1 = u$1.split(`.`).filter(u$2 => u$2 === `*`)
    if (A$1.length > j.length)
      j = [...A$1]
  })
  j.forEach(() => {
    Object.keys(A).forEach((j$1) => {
      const M = j$1.split(`.`)
      const N = M.indexOf(`*`, 1)
      if (N < 1)
        return
      const P = M.slice(0, N).join(`.`)
      const I = getNestedValue(u, P.startsWith(`:`) ? P.slice(1) : P)
      if (!isArray(I))
        return
      I.forEach((u$1, P$1) => {
        const F = [...M]
        F[N] = `${P$1}`
        A[F.join(`.`)] = A[j$1]
      })
      delete A[j$1]
    })
  })
}
function validationError(u, A) {
  util.error(u, `ValidationError`, null, { ...A })
}
function appendValidationError(u, A) {
  util.appendError(u, `ValidationError`, null, { ...A })
}
function formatAttributeName(u) {
  return u.split(`.`).reduce((u$1, A) => {
    if (util.matches(`^\\d+$`, A))
      return u$1
    let j = ``
    A.split(``).forEach((u$2, A$1) => {
      if (A$1 !== 0 && util.matches(`[A-Z]`, u$2))
        j += ` `
      j += u$2.toLowerCase()
    })
    return u$1 ? `${u$1} ${j}` : j
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
// # sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsIm5hbWVzIjpbIm0iLCJwIiwiZSIsInUiLCJqIiwiTSIsIkEiLCJQIl0sInNvdXJjZXMiOlsiLi4vLi4vZGlzdC91dGlscy5qcyIsIi4uLy4uL2Rpc3QvaW5kZXguanMiLCJoYW5kbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydHt1dGlsfWZyb21cIkBhd3MtYXBwc3luYy91dGlsc1wiO2Z1bmN0aW9uIGlzQXJyYXkoZSl7cmV0dXJuIHR5cGVvZiBlPT09YG9iamVjdGAmJiEhZSYmdHlwZW9mIGU/Lmxlbmd0aD09PWBudW1iZXJgfWZ1bmN0aW9uIGdldE5lc3RlZFZhbHVlKHAsbSl7cmV0dXJuIG0uc3BsaXQoYC5gKS5yZWR1Y2UoKHAsbSk9PntyZXR1cm4gdXRpbC5tYXRjaGVzKGBeXFxcXGQrJGAsbSk/cFt0b051bWJlcihtKV06cFttXX0scCl9ZnVuY3Rpb24gc2V0TmVzdGVkVmFsdWUoZSxwLGgpe2NvbnN0IGc9cC5zcGxpdChgLmApO2lmKGcubGVuZ3RoPT09MSl7ZVtnWzBdXT1oO3JldHVybn1jb25zdCBfPWcucG9wKCk7Y29uc3Qgdj1nZXROZXN0ZWRWYWx1ZShlLGcuam9pbihgLmApKTtpZih0eXBlb2Ygdj09PWBvYmplY3RgJiYhIXYpdltfXT1ofWZ1bmN0aW9uIGdldEhlYWRlcihlLHApe2NvbnN0IG09ZS50b0xvd2VyQ2FzZSgpO2NvbnN0IGg9T2JqZWN0LmtleXMocC5yZXF1ZXN0LmhlYWRlcnMpLmZpbmQoZT0+ZS50b0xvd2VyQ2FzZSgpPT09bSk7cmV0dXJuIGg/cC5yZXF1ZXN0LmhlYWRlcnNbaF06bnVsbH1mdW5jdGlvbiBjbGVhblN0cmluZyhlLHApe2lmKHA/LnRyaW09PT1mYWxzZSlyZXR1cm4gZTtjb25zdCBtPWUudHJpbSgpO2lmKHA/LmFsbG93RW1wdHlTdHJpbmcpcmV0dXJuIG07cmV0dXJuIG09PT1gYD9udWxsOm19ZnVuY3Rpb24gdG9OdW1iZXIocCl7c3dpdGNoKHRydWUpe2Nhc2UgdXRpbC5tYXRjaGVzKGBeKC18XFxcXCspP1xcXFxkKyhcXFxcLlxcXFxkKyk/JGAscCk6cmV0dXJuK3A7Y2FzZSB1dGlsLm1hdGNoZXMoYF4oLXxcXFxcKyk/SW5maW5pdHkkYCxwKTpyZXR1cm4rcDtkZWZhdWx0OnV0aWwuZXJyb3IoYEludmFsaWQgbnVtYmVyOiAke3B9YCl9fWNvbnN0IHV1aWQ9YF5bMC05YS1mXXs4fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXs0fS1bMC05YS1mXXsxMn0kYDtjb25zdCB1bGlkPWBeWzAxMjM0NTY3ODlBQkNERUZHSEpLTU5QUVJTVFZXWFlaXXsyNn0kYDtjb25zdCB1cmw9YF5odHRwcz86XFxcXC9cXFxcLyh3d3dcXFxcLik/Wy1hLXpBLVowLTlAOiUuX1xcXFwrfiM9XXsxLDI1Nn1cXFxcLlthLXpBLVowLTkoKV17MSw2fVxcXFxiKFstYS16QS1aMC05KClAOiVfXFxcXCsufiM/Ji8vPV0qKSR8Xmh0dHBzPzpcXFxcL1xcXFwvKGxvY2FsaG9zdHxcXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9XFxcXC5cXFxcZHsxLDN9KSg6XFxcXGQrKT8oXFxcXC8uKik/JGA7Y29uc3QgZW1haWw9YF5bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcXFwuW2EtekEtWl17Mix9JGA7Y29uc3QgcGhvbmU9YF5cXFxcK1sxLTldXFxcXGR7MSwyMH0kYDtjb25zdCBkYXRlPWBeXFxcXGR7NH0tKDBbMS05XXwxWzAtMl0pLSgwWzEtOV18WzEyXVxcXFxkfDNbMDFdKSRgO2NvbnN0IHRpbWU9YF4oWzAxXVxcXFxkfDJbMC0zXSk6WzAtNV1cXFxcZDpbMC01XVxcXFxkKFxcXFwuXFxcXGR7MSw2fSk/Wj8kYDtjb25zdCBkYXRldGltZT1gXlxcXFxkezR9LSgwWzEtOV18MVswLTJdKS0oMFsxLTldfFsxMl1cXFxcZHwzWzAxXSlUKFswMV1cXFxcZHwyWzAtM10pOlswLTVdXFxcXGQ6WzAtNV1cXFxcZChcXFxcLlxcXFxkezEsNn0pP1okYDtjb25zdCBudW1lcmljPWBeLT9cXFxcZCsoXFxcXC5cXFxcZCspPyRgO2NvbnN0IGludGVnZXI9YF4tP1xcXFxkKyRgO2NvbnN0IGJhc2VFcnJvcnM9e21heE51bWJlcjpgOmF0dHIgbWF4IHZhbHVlIGlzIDptYXhgLG1pbk51bWJlcjpgOmF0dHIgbWluIHZhbHVlIGlzIDptaW5gLGJldHdlZW5OdW1iZXI6YDphdHRyIHZhbHVlIG11c3QgYmUgYmV0d2VlbiA6bWluIGFuZCA6bWF4YCxiaWdnZXJOdW1iZXI6YDphdHRyIG11c3QgYmUgYmlnZ2VyIHRoYW4gOm1pbmAsbG93ZXJOdW1iZXI6YDphdHRyIG11c3QgYmUgbG93ZXIgdGhhbiA6bWF4YCx3aXRoaW5OdW1iZXI6YDphdHRyIG11c3QgYmUgd2l0aGluIDptaW4gYW5kIDptYXhgLG1heFN0cmluZzpgOmF0dHIgbXVzdCBub3QgZXhjZWVkIDptYXggY2hhcmFjdGVyc2AsbWluU3RyaW5nOmA6YXR0ciBtdXN0IGhhdmUgYXQgbGVhc3QgOm1pbiBjaGFyYWN0ZXJzYCxiZXR3ZWVuU3RyaW5nOmA6YXR0ciBtdXN0IGhhdmUgYmV0d2VlbiA6bWluIGFuZCA6bWF4IGNoYXJhY3RlcnNgLG1pbkFycmF5OmA6YXR0ciBtdXN0IGhhdmUgYXQgbGVhc3QgOm1pbiBlbGVtZW50c2AsbWF4QXJyYXk6YDphdHRyIG11c3QgaGF2ZSBhdCBtb3N0IDptYXggZWxlbWVudHNgLGJldHdlZW5BcnJheTpgOmF0dHIgbXVzdCBoYXZlIGJldHdlZW4gOm1pbiBhbmQgOm1heCBlbGVtZW50c2AsaW46YDphdHRyIG11c3QgYmUgb25lIG9mIHRoZSBzcGVjaWZpZWQgdmFsdWVzOiA6aW5gLG5vdEluOmA6YXR0ciBtdXN0IG5vdCBiZSBvbmUgb2YgdGhpcyBsaXN0OiA6bm90SW5gLGVtYWlsOmA6YXR0ciBtdXN0IGJlIGEgdmFsaWQgZW1haWwgYWRkcmVzcyAobmFtZUBkb21haW4uY29tKWAscGhvbmU6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBwaG9uZSBudW1iZXIgKCsxMjMuLi4pYCx1cmw6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBVUkwgKDpwYXR0ZXJuKWAsdXVpZDpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIFVVSUQgKDpwYXR0ZXJuKWAsdWxpZDpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIFVMSUQgKDpwYXR0ZXJuKWAsZGF0ZTpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIGRhdGUgKDpwYXR0ZXJuKWAsdGltZTpgOmF0dHIgbXVzdCBiZSBhIHZhbGlkIHRpbWUgKDpwYXR0ZXJuKWAsZGF0ZXRpbWU6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBkYXRldGltZSAoOnBhdHRlcm4pYCxudW1lcmljOmA6YXR0ciBtdXN0IGJlIGEgdmFsaWQgbnVtYmVyICg6cGF0dGVybilgLGludGVnZXI6YDphdHRyIG11c3QgYmUgYSB2YWxpZCBpbnRlZ2VyICg6cGF0dGVybilgLHR5cGU6YDphdHRyIGlzIG5vdCB2YWxpZCA6dHlwZWAscmVnZXg6YDphdHRyIG11c3QgbWF0Y2ggOnBhdHRlcm5gLHJlZ2V4X3BhdHRlcm5zOmBhdHRyOiBtdXN0IG1hdGNoIGFueSBvZiA6cGF0dGVybnNgLHJlcXVpcmVkOmA6YXR0ciBpcyByZXF1aXJlZGAsbnVsbGFibGU6YDphdHRyIGlzIG51bGxhYmxlYCxzb21ldGltZXM6YDphdHRyIGNhbm5vdCBiZSBudWxsYCxiZWZvcmU6YDphdHRyIG11c3QgYmUgYmVmb3JlIDpiZWZvcmVgLGJlZm9yZU9yRXF1YWw6YDphdHRyIG11c3QgYmUgYmVmb3JlIG9yIGVxdWFsIHRvIDpiZWZvcmVPckVxdWFsYCxhZnRlcjpgOmF0dHIgbXVzdCBiZSBhZnRlciA6YWZ0ZXJgLGFmdGVyT3JFcXVhbDpgOmF0dHIgbXVzdCBiZSBhZnRlciBvciBlcXVhbCB0byA6YWZ0ZXJPckVxdWFsYCxpbnZhbGlkOmA6YXR0ciBpcyBub3QgdmFsaWRgfTtmdW5jdGlvbiBwYXJzZUVycm9yTWVzc2FnZShlLHApe2xldCBtPWU7T2JqZWN0LmVudHJpZXMocD8/e30pLmZvckVhY2goKFtlLHBdKT0+e209bS5yZXBsYWNlQWxsKGUscCl9KTtyZXR1cm4gbX1leHBvcnR7YmFzZUVycm9ycyxjbGVhblN0cmluZyxkYXRlLGRhdGV0aW1lLGVtYWlsLGdldEhlYWRlcixnZXROZXN0ZWRWYWx1ZSxpbnRlZ2VyLGlzQXJyYXksbnVtZXJpYyxwYXJzZUVycm9yTWVzc2FnZSxwaG9uZSxzZXROZXN0ZWRWYWx1ZSx0aW1lLHRvTnVtYmVyLHVsaWQsdXJsLHV1aWR9OyIsImltcG9ydHtiYXNlRXJyb3JzLGNsZWFuU3RyaW5nLGRhdGUsZGF0ZXRpbWUsZW1haWwsZ2V0SGVhZGVyLGdldE5lc3RlZFZhbHVlLGludGVnZXIsaXNBcnJheSxudW1lcmljLHBhcnNlRXJyb3JNZXNzYWdlLHBob25lLHNldE5lc3RlZFZhbHVlLHRpbWUsdWxpZCx1cmwsdXVpZH1mcm9tXCIuL3V0aWxzLmpzXCI7aW1wb3J0e3J1bnRpbWUsdXRpbH1mcm9tXCJAYXdzLWFwcHN5bmMvdXRpbHNcIjtmdW5jdGlvbiBwYXJzZSh1LEEpe2NvbnN0W1AsLi4uRl09dHlwZW9mIEE9PT1gc3RyaW5nYD9bQSx2b2lkIDBdOmlzQXJyYXkoQSk/W0FbMF0sLi4uQS5zbGljZSgxKV06dHlwZW9mIEEucnVsZT09PWBzdHJpbmdgP1tBLnJ1bGUsdm9pZCAwXTpbQS5ydWxlWzBdLC4uLkEucnVsZS5zbGljZSgxKV07c3dpdGNoKFApe2Nhc2VgcmVxdWlyZWRgOnJldHVybiByZXF1aXJlZFJ1bGUodSk7Y2FzZWBudWxsYWJsZWA6cmV0dXJuIG51bGxhYmxlUnVsZSh1KTtjYXNlYHNvbWV0aW1lc2A6dXRpbC5lcnJvcihgc29tZXRpbWVzIHJ1bGUgaXMgbm90IGFsbG93ZWQgaGVyZWApO2JyZWFrO2Nhc2VgbWluYDpjYXNlYGJpZ2dlcmA6cmV0dXJuIGJldHdlZW5SdWxlKHUsRlswXSx2b2lkIDAsUD09PWBiaWdnZXJgKTtjYXNlYG1heGA6Y2FzZWBsb3dlcmA6cmV0dXJuIGJldHdlZW5SdWxlKHUsdm9pZCAwLEZbMF0sUD09PWBsb3dlcmApO2Nhc2VgYmV0d2VlbmA6Y2FzZWB3aXRoaW5gOnJldHVybiBiZXR3ZWVuUnVsZSh1LEZbMF0sRlsxXSxQPT09YHdpdGhpbmApO2Nhc2VgcmVnZXhgOnJldHVybiByZWdleFJ1bGUodSwuLi5GKTtjYXNlYGluYDpyZXR1cm4gaW5SdWxlKHUsLi4uRik7Y2FzZWBub3RJbmA6cmV0dXJuIG5vdEluUnVsZSh1LC4uLkYpO2Nhc2VgYmVmb3JlYDpjYXNlYGJlZm9yZU9yRXF1YWxgOnJldHVybiBiZWZvcmVSdWxlKHUsRlswXSxQPT09YGJlZm9yZWApO2Nhc2VgYWZ0ZXJgOmNhc2VgYWZ0ZXJPckVxdWFsYDpyZXR1cm4gYWZ0ZXJSdWxlKHUsRlswXSxQPT09YGFmdGVyYCk7Y2FzZWBlbWFpbGA6cmV0dXJuIHJlZ2V4UnVsZSh7Li4udSxtc2c6dS5tc2c/P3UuZXJyb3JzLmVtYWlsfSxlbWFpbCk7Y2FzZWBwaG9uZWA6cmV0dXJuIHJlZ2V4UnVsZSh7Li4udSxtc2c6dS5tc2c/P3UuZXJyb3JzLnBob25lfSxwaG9uZSk7Y2FzZWB1cmxgOnJldHVybiByZWdleFJ1bGUoey4uLnUsbXNnOnUubXNnPz91LmVycm9ycy51cmx9LHVybCk7Y2FzZWB1dWlkYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMudXVpZH0sdXVpZCk7Y2FzZWB1bGlkYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMudWxpZH0sdWxpZCk7Y2FzZWBpbnRlZ2VyYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMuaW50ZWdlcn0saW50ZWdlcik7Y2FzZWBkYXRlYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMuZGF0ZX0sZGF0ZSk7Y2FzZWB0aW1lYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMudGltZX0sdGltZSk7Y2FzZWBkYXRldGltZWA6cmV0dXJuIHJlZ2V4UnVsZSh7Li4udSxtc2c6dS5tc2c/P3UuZXJyb3JzLmRhdGV0aW1lfSxkYXRldGltZSk7Y2FzZWBudW1lcmljYDpyZXR1cm4gcmVnZXhSdWxlKHsuLi51LG1zZzp1Lm1zZz8/dS5lcnJvcnMubnVtZXJpY30sbnVtZXJpYyk7ZGVmYXVsdDpyZXR1cm4gdHlwZVJ1bGUodSxQKX19ZnVuY3Rpb24gYmV0d2VlblJ1bGUoe3ZhbHVlOnUsbXNnOkEsZXJyb3JzOmp9LE09LUluZmluaXR5LE49SW5maW5pdHksUD1mYWxzZSl7Y29uc3RbRixJXT1bTj09PUluZmluaXR5LE09PT0tSW5maW5pdHldO2NvbnN0IFI9e2NoZWNrOmZhbHNlLG1zZzpBPz9GP1A/ai5iaWdnZXJOdW1iZXI6ai5taW5OdW1iZXI6ST9QP2oubG93ZXJOdW1iZXI6ai5tYXhOdW1iZXI6UD9qLndpdGhpbk51bWJlcjpqLmJldHdlZW5OdW1iZXIsdmFsdWU6dSxwYXJhbXM6e1wiOm1pblwiOmAke019YCxcIjptYXhcIjpgJHtOfWB9fTtpZih0eXBlb2YgdT09PWBudW1iZXJgKVIuY2hlY2s9UD91Pk0mJnU8Tjp1Pj1NJiZ1PD1OO2lmKHR5cGVvZiB1PT09YHN0cmluZ2Ape1IuY2hlY2s9dS5sZW5ndGg+PU0mJnUubGVuZ3RoPD1OO1IubXNnPUE/P0Y/ai5taW5TdHJpbmc6ST9qLm1heFN0cmluZzpqLmJldHdlZW5TdHJpbmd9aWYoaXNBcnJheSh1KSl7Ui5jaGVjaz11Lmxlbmd0aD49TSYmdS5sZW5ndGg8PU47Ui5tc2c9QT8/Rj9qLm1pbkFycmF5Okk/ai5tYXhBcnJheTpqLmJldHdlZW5BcnJheX1yZXR1cm4gUn1mdW5jdGlvbiByZWdleFJ1bGUodSwuLi5BKXtjb25zdCBqPXtjaGVjazpmYWxzZSxtc2c6dS5tc2c/PyhBLmxlbmd0aD09PTE/dS5lcnJvcnMucmVnZXg6dS5lcnJvcnMucmVnZXhfcGF0dGVybnMpLHZhbHVlOnUudmFsdWUscGFyYW1zOkEubGVuZ3RoPT09MT97XCI6cGF0dGVyblwiOkFbMF19OntcIjpwYXR0ZXJuc1wiOkEuam9pbihgLCBgKX19O2lmKHR5cGVvZiB1LnZhbHVlPT09YHN0cmluZ2B8fHR5cGVvZiB1LnZhbHVlPT09YG51bWJlcmApe2NvbnN0IE09dHlwZW9mIHUudmFsdWU9PT1gc3RyaW5nYD91LnZhbHVlOmAke3UudmFsdWV9YDtsZXQgTj1mYWxzZTtBLmZvckVhY2godT0+e2lmKE58fHV0aWwubWF0Y2hlcyh1LE0pKU49dHJ1ZX0pO2ouY2hlY2s9Tn1yZXR1cm4gan1mdW5jdGlvbiBpblJ1bGUoe3ZhbHVlOnUsbXNnOkEsZXJyb3JzOmp9LC4uLk0pe3JldHVybntjaGVjazpNLmluY2x1ZGVzKHUpLG1zZzpBPz9qLmluLHZhbHVlOnUscGFyYW1zOntcIjppblwiOk0uam9pbihgLCBgKX19fWZ1bmN0aW9uIG5vdEluUnVsZSh7dmFsdWU6dSxtc2c6QSxlcnJvcnM6an0sLi4uTSl7cmV0dXJue2NoZWNrOiFNLmluY2x1ZGVzKHUpLG1zZzpBPz9qLm5vdEluLHZhbHVlOnUscGFyYW1zOntcIjpub3RJblwiOk0uam9pbihgLCBgKX19fWZ1bmN0aW9uIHJlcXVpcmVkUnVsZSh7dmFsdWU6dSxtc2c6QSxlcnJvcnM6an0pe2NvbnN0IE09e2NoZWNrOnRydWUsbXNnOkE/P2oucmVxdWlyZWQsdmFsdWU6dSxza2lwTmV4dDp0cnVlfTtpZih0eXBlb2YgdT09PWBzdHJpbmdgKU0uY2hlY2s9dS5sZW5ndGg+MDtpZihpc0FycmF5KHUpKU0uY2hlY2s9dS5sZW5ndGg+MDtpZih0eXBlb2YgdT09PWBudW1iZXJgKU0uY2hlY2s9dHJ1ZTtpZih0eXBlb2YgdT09PWBib29sZWFuYClNLmNoZWNrPXRydWU7aWYodHlwZW9mIHU9PT1gb2JqZWN0YCYmIU0udmFsdWUpTS5jaGVjaz1mYWxzZTtpZih0eXBlb2YgdT09PWB1bmRlZmluZWRgKU0uY2hlY2s9ZmFsc2U7TS5za2lwTmV4dD0hTS5jaGVjaztyZXR1cm4gTX1mdW5jdGlvbiBudWxsYWJsZVJ1bGUoe3ZhbHVlOnUsbXNnOkEsZXJyb3JzOmp9KXtyZXR1cm57Y2hlY2s6dHJ1ZSxtc2c6QT8/ai5udWxsYWJsZSx2YWx1ZTp1LHNraXBOZXh0OnR5cGVvZiB1PT09YHVuZGVmaW5lZGB8fHU9PT1udWxsfX1mdW5jdGlvbiBzb21ldGltZXNSdWxlKHt2YWx1ZTp1LG1zZzpBLGVycm9yczpqLHBhcmVudDpNLGtleTpOfSl7Y29uc3QgUD17Y2hlY2s6dHJ1ZSxtc2c6QT8/ai5zb21ldGltZXMsdmFsdWU6dX07aWYoIU9iamVjdC5oYXNPd24oTSxOKSl7UC5za2lwTmV4dD10cnVlO3JldHVybiBQfWlmKHR5cGVvZiB1PT09YG9iamVjdGAmJiFQLnZhbHVlKXtQLmNoZWNrPWZhbHNlO1Auc2tpcE5leHQ9dHJ1ZTtyZXR1cm4gUH1yZXR1cm4gcmVxdWlyZWRSdWxlKHt2YWx1ZTp1LG1zZzpBLGVycm9yczpqfSl9ZnVuY3Rpb24gdHlwZVJ1bGUoe3ZhbHVlOnUsbXNnOkEsZXJyb3JzOmp9LE0pe2NvbnN0IE49e2NoZWNrOmZhbHNlLG1zZzpBPz9qLnR5cGUsdmFsdWU6dSxwYXJhbXM6e1wiOnR5cGVcIjpNfX07c3dpdGNoKE0pe2Nhc2VgYXJyYXlgOk4uY2hlY2s9aXNBcnJheSh1KTticmVhaztjYXNlYG9iamVjdGA6Ti5jaGVjaz10eXBlb2YgdT09PWBvYmplY3RgJiYhIXUmJiFpc0FycmF5KHUpJiZPYmplY3Qua2V5cyh1KS5sZW5ndGg+MDticmVhaztjYXNlYGJvb2xlYW5gOk4uY2hlY2s9dHlwZW9mIHU9PT1gYm9vbGVhbmA7YnJlYWs7Y2FzZWBudW1iZXJgOk4uY2hlY2s9dHlwZW9mIHU9PT1gbnVtYmVyYDticmVhaztkZWZhdWx0Ok4uY2hlY2s9dHlwZW9mIHU9PT1gc3RyaW5nYH1yZXR1cm4gTn1mdW5jdGlvbiBiZWZvcmVSdWxlKHt2YWx1ZTp1LG1zZzpBLGVycm9yczpqfSxNLE49ZmFsc2Upe2NvbnN0IFA9e2NoZWNrOmZhbHNlLG1zZzpBPz9qLmJlZm9yZSx2YWx1ZTp1LHBhcmFtczpOP3tcIjpiZWZvcmVcIjpNfTp7XCI6YmVmb3JlT3JFcXVhbFwiOk19fTtjb25zdCBGPXV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKE0pO2NvbnN0IEk9dHlwZW9mIHU9PT1gc3RyaW5nYD91dGlsLnRpbWUucGFyc2VJU084NjAxVG9FcG9jaE1pbGxpU2Vjb25kcyh1KTp1O2lmKHR5cGVvZiBJPT09YG51bWJlcmApUC5jaGVjaz1OP0k8RjpJPD1GO3JldHVybiBQfWZ1bmN0aW9uIGFmdGVyUnVsZSh7dmFsdWU6dSxtc2c6QSxlcnJvcnM6an0sTSxOPWZhbHNlKXtjb25zdCBQPXtjaGVjazpmYWxzZSxtc2c6QT8/Tj9qLmFmdGVyOmouYWZ0ZXJPckVxdWFsLHZhbHVlOnUscGFyYW1zOk4/e1wiOmFmdGVyXCI6TX06e1wiOmFmdGVyT3JFcXVhbFwiOk19fTtjb25zdCBGPXV0aWwudGltZS5wYXJzZUlTTzg2MDFUb0Vwb2NoTWlsbGlTZWNvbmRzKE0pO2NvbnN0IEk9dHlwZW9mIHU9PT1gc3RyaW5nYD91dGlsLnRpbWUucGFyc2VJU084NjAxVG9FcG9jaE1pbGxpU2Vjb25kcyh1KTp1O2lmKHR5cGVvZiBJPT09YG51bWJlcmApUC5jaGVjaz1OP0k+RjpJPj1GO3JldHVybiBQfWZ1bmN0aW9uIGlzUnVsZSh1KXtyZXR1cm4gdHlwZW9mIHU9PT1gb2JqZWN0YCYmISF1JiZPYmplY3QuaGFzT3duKHUsYGNoZWNrYCl9ZnVuY3Rpb24gaXNDdXN0b21GdWxsUnVsZSh1KXtyZXR1cm4gdHlwZW9mIHU9PT1gb2JqZWN0YCYmISF1JiZPYmplY3QuaGFzT3duKHUsYHJ1bGVgKX1mdW5jdGlvbiB2YWxpZGF0ZShqLE0sTil7bGV0IFA9e307Y29uc3QgST17Li4uYmFzZUVycm9ycywuLi5OPy5lcnJvcnN9O2lmKHR5cGVvZiBqIT09YG9iamVjdGApdXRpbC5lcnJvcihgT2JqZWN0IGV4cGVjdGVkYCk7c2FuaXRpemVOZXN0ZWRBcnJheShqLE0pO2lmKE4/LmF0dHJpYnV0ZXMpc2FuaXRpemVOZXN0ZWRBcnJheShqLE4uYXR0cmlidXRlcyk7Y29uc3QgTD1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGopKTtPYmplY3Qua2V5cyhNKS5mb3JFYWNoKHU9PntsZXQgaj1nZXROZXN0ZWRWYWx1ZShMLHUpO2NvbnN0IFI9dS5zcGxpdChgLmApLmxlbmd0aD4xP2dldE5lc3RlZFZhbHVlKEwsdS5zcGxpdChgLmApLnNsaWNlKDAsLTEpLmpvaW4oYC5gKSk6TDtpZih0eXBlb2Ygaj09PWBzdHJpbmdgKXtqPWNsZWFuU3RyaW5nKGosTik7c2V0TmVzdGVkVmFsdWUoTCx1LGopfWxldCB6PWZhbHNlO2NvbnN0IEI9TVt1XTtpZihCPy5sZW5ndGgpQi5mb3JFYWNoKEE9PntpZih6KXJldHVybjtjb25zdCBNPWlzUnVsZShBKT97Li4uQSx2YWx1ZTpqLG1zZzpBLm1zZz8/SS5pbnZhbGlkfTppc0N1c3RvbUZ1bGxSdWxlKEEpP3BhcnNlKHt2YWx1ZTpqLG1zZzpBLm1zZyxlcnJvcnM6SX0sQS5ydWxlKTpBPT09YHNvbWV0aW1lc2A/c29tZXRpbWVzUnVsZSh7dmFsdWU6aixlcnJvcnM6SSxwYXJlbnQ6UixrZXk6dS5zcGxpdChgLmApLnBvcCgpfSk6cGFyc2Uoe3ZhbHVlOmosZXJyb3JzOkl9LEEpO3o9ISFNLnNraXBOZXh0fHwhTS5jaGVjaztpZihNLmNoZWNrKXJldHVybjtpZihQLm1zZylhcHBlbmRWYWxpZGF0aW9uRXJyb3IoUC5tc2csey4uLlAuZXJyb3JJbmZvfSk7TS5wYXJhbXM9TS5wYXJhbXM/P3t9O2lmKHV0aWwubWF0Y2hlcyhgOmF0dHJgLE0ubXNnKSlNLnBhcmFtc1tgOmF0dHJgXT1OPy5hdHRyaWJ1dGVzPy5bYDoke3V9YF0/P2Zvcm1hdEF0dHJpYnV0ZU5hbWUodSk7UD17bXNnOnBhcnNlRXJyb3JNZXNzYWdlKE0ubXNnLE0ucGFyYW1zKSxlcnJvclR5cGU6YFZhbGlkYXRpb25FcnJvcmAsZGF0YTpudWxsLGVycm9ySW5mbzp7cGF0aDp1LHZhbHVlOmp9fX0pfSk7aWYoIVAubXNnKXJldHVybiBMO3ZhbGlkYXRpb25FcnJvcihQLm1zZyx7Li4uUC5lcnJvckluZm99KX1mdW5jdGlvbiBzYW5pdGl6ZU5lc3RlZEFycmF5KHUsQSl7bGV0IGo9W107T2JqZWN0LmtleXMoQSkuZm9yRWFjaCh1PT57Y29uc3QgQT11LnNwbGl0KGAuYCkuZmlsdGVyKHU9PnU9PT1gKmApO2lmKEEubGVuZ3RoPmoubGVuZ3RoKWo9Wy4uLkFdfSk7ai5mb3JFYWNoKCgpPT57T2JqZWN0LmtleXMoQSkuZm9yRWFjaChqPT57Y29uc3QgTT1qLnNwbGl0KGAuYCk7Y29uc3QgTj1NLmluZGV4T2YoYCpgLDEpO2lmKE48MSlyZXR1cm47Y29uc3QgUD1NLnNsaWNlKDAsTikuam9pbihgLmApO2NvbnN0IEk9Z2V0TmVzdGVkVmFsdWUodSxQLnN0YXJ0c1dpdGgoYDpgKT9QLnNsaWNlKDEpOlApO2lmKCFpc0FycmF5KEkpKXJldHVybjtJLmZvckVhY2goKHUsUCk9Pntjb25zdCBGPVsuLi5NXTtGW05dPWAke1B9YDtBW0Yuam9pbihgLmApXT1BW2pdfSk7ZGVsZXRlIEFbal19KX0pfWZ1bmN0aW9uIHByZWNvZ25pdGl2ZVZhbGlkYXRpb24odSxBLGope2NvbnN0e2Vycm9yczpNLGF0dHJpYnV0ZXM6Tn09aXNMb2NhbGl6ZWQodSk/e2Vycm9yczp7Li4udS5zdGFzaC5fX2kxOG4uZXJyb3JzLC4uLmo/LmVycm9yc30sYXR0cmlidXRlczp7Li4udS5zdGFzaC5fX2kxOG4uYXR0cmlidXRlcywuLi5qPy5hdHRyaWJ1dGVzfX06e2Vycm9yczpqPy5lcnJvcnMsYXR0cmlidXRlczpqPy5hdHRyaWJ1dGVzfTtpZihnZXRIZWFkZXIoYHByZWNvZ25pdGlvbmAsdSkhPT1gdHJ1ZWApcmV0dXJuIHUuc3Rhc2guX192YWxpZGF0ZWQ9dmFsaWRhdGUodS5hcmdzLEEsey4uLmosZXJyb3JzOk0sYXR0cmlidXRlczpOfSk7Y29uc3QgRj1nZXRIZWFkZXIoYFByZWNvZ25pdGlvbi1WYWxpZGF0ZS1Pbmx5YCx1KT8uc3BsaXQoYCxgKS5tYXAodT0+dS50cmltKCkpO3V0aWwuaHR0cC5hZGRSZXNwb25zZUhlYWRlcihgUHJlY29nbml0aW9uYCxgdHJ1ZWApO2lmKCFGKXt1LnN0YXNoLl9fdmFsaWRhdGVkPXZhbGlkYXRlKHUuYXJncyxBLHsuLi5qLGVycm9yczpNLGF0dHJpYnV0ZXM6Tn0pO3V0aWwuaHR0cC5hZGRSZXNwb25zZUhlYWRlcihgUHJlY29nbml0aW9uLVN1Y2Nlc3NgLGB0cnVlYCk7cnVudGltZS5lYXJseVJldHVybihudWxsKX11dGlsLmh0dHAuYWRkUmVzcG9uc2VIZWFkZXIoYFByZWNvZ25pdGlvbi1WYWxpZGF0ZS1Pbmx5YCxGLmpvaW4oYCxgKSk7Y29uc3QgST17fTtGLmZvckVhY2godT0+e0lbdV09QVt1XX0pO3Uuc3Rhc2guX192YWxpZGF0ZWQ9dmFsaWRhdGUodS5hcmdzLEksey4uLmosZXJyb3JzOk0sYXR0cmlidXRlczpOfSk7dXRpbC5odHRwLmFkZFJlc3BvbnNlSGVhZGVyKGBQcmVjb2duaXRpb24tU3VjY2Vzc2AsYHRydWVgKTtydW50aW1lLmVhcmx5UmV0dXJuKG51bGwse3NraXBUbzpqPy5za2lwVG8/P2BFTkRgfSl9ZnVuY3Rpb24gdmFsaWRhdGlvbkVycm9yKHUsQSl7dXRpbC5lcnJvcih1LGBWYWxpZGF0aW9uRXJyb3JgLG51bGwsey4uLkF9KX1mdW5jdGlvbiBhcHBlbmRWYWxpZGF0aW9uRXJyb3IodSxBKXt1dGlsLmFwcGVuZEVycm9yKHUsYFZhbGlkYXRpb25FcnJvcmAsbnVsbCx7Li4uQX0pfWZ1bmN0aW9uIGZvcm1hdEF0dHJpYnV0ZU5hbWUodSl7cmV0dXJuIHUuc3BsaXQoYC5gKS5yZWR1Y2UoKHUsQSk9PntpZih1dGlsLm1hdGNoZXMoYF5cXFxcZCskYCxBKSlyZXR1cm4gdTtsZXQgaj1gYDtBLnNwbGl0KGBgKS5mb3JFYWNoKCh1LEEpPT57aWYoQSE9PTAmJnV0aWwubWF0Y2hlcyhgW0EtWl1gLHUpKWorPWAgYDtqKz11LnRvTG93ZXJDYXNlKCl9KTtyZXR1cm4gdT9gJHt1fSAke2p9YDpqfSxgYCl9ZnVuY3Rpb24gYXNzZXJ0VmFsaWRhdGVkKHUpe2lmKE9iamVjdC5oYXNPd24odS5zdGFzaCxgX192YWxpZGF0ZWRgKSlyZXR1cm47dXRpbC5lcnJvcihgQ29udGV4dCBhcmd1bWVudHMgaGF2ZSBub3QgYmVlbiB2YWxpZGF0ZWRgKX1mdW5jdGlvbiBpc0xvY2FsaXplZCh1LEEpe2lmKE9iamVjdC5oYXNPd24odS5zdGFzaCxgX19pMThuYCkmJnR5cGVvZiB1LnN0YXNoPy5fX2kxOG4ubG9jYWxlPT09YHN0cmluZ2ApcmV0dXJuIEE/dS5zdGFzaC5fX2kxOG4ubG9jYWxlPT09QTp0cnVlO3JldHVybiBmYWxzZX1mdW5jdGlvbiBhc3NlcnRMb2NhbGl6ZWQodSxBKXtpZihpc0xvY2FsaXplZCh1LEEpKXJldHVybjt1dGlsLmVycm9yKGBDb250ZXh0IGFyZ3VlbWVudHMgaGF2ZSBub3QgYmVlbiBsb2NhbGl6ZWRgKX1leHBvcnR7YXBwZW5kVmFsaWRhdGlvbkVycm9yLGFzc2VydExvY2FsaXplZCxhc3NlcnRWYWxpZGF0ZWQsZm9ybWF0QXR0cmlidXRlTmFtZSxpc0xvY2FsaXplZCxwcmVjb2duaXRpdmVWYWxpZGF0aW9uLHZhbGlkYXRlLHZhbGlkYXRpb25FcnJvcn07IiwiaW1wb3J0IHR5cGUgeyBDb250ZXh0IH0gZnJvbSAnQGF3cy1hcHBzeW5jL3V0aWxzJ1xuaW1wb3J0IHsgdXRpbCB9IGZyb20gJ0Bhd3MtYXBwc3luYy91dGlscydcbmltcG9ydCB7IHZhbGlkYXRlIH0gZnJvbSAnQHNvdDE5ODYvYXBwc3luYy1wcmVjb2duaXRpb24nXG5cbmludGVyZmFjZSBVc2VyIHtcbiAgbmFtZTogc3RyaW5nXG4gIGFnZTogbnVtYmVyXG4gIGVtYWlsOiBzdHJpbmdcbiAgYWRkcmVzcz86IHtcbiAgICBzdHJlZXQ6IHN0cmluZ1xuICAgIGNpdHk6IHN0cmluZ1xuICAgIGNvdW50cnk6IHN0cmluZ1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0KGN0eDogQ29udGV4dDxVc2VyPikge1xuICB2YWxpZGF0ZSh7XG4gICAgbmFtZTogY3R4LmFyZ3VtZW50cy5uYW1lLFxuICAgIGFnZTogY3R4LmFyZ3VtZW50cy5hZ2UsXG4gICAgZW1haWw6IGN0eC5hcmd1bWVudHMuZW1haWwsXG4gICAgYWRkcmVzczoge1xuICAgICAgc3RyZWV0OiBjdHguYXJndW1lbnRzLmFkZHJlc3M/LnN0cmVldCxcbiAgICAgIGNpdHk6IGN0eC5hcmd1bWVudHMuYWRkcmVzcz8uY2l0eSxcbiAgICAgIGNvdW50cnk6IGN0eC5hcmd1bWVudHMuYWRkcmVzcz8uY291bnRyeSxcbiAgICB9LFxuICB9LCB7XG4gICAgJ25hbWUnOiBbJ21pbjoyJywgJ21heDoyNSddLFxuICAgICdhZ2UnOiBbJ2JldHdlZW46MTgsMTAwJ10sXG4gICAgJ2VtYWlsJzogWydlbWFpbCddLFxuICAgICdhZGRyZXNzLnN0cmVldCc6IFsnbWF4OjI1NSddLFxuICAgICdhZGRyZXNzLmNvdW50cnknOiBbJ2luOklULEZSLEdCJ10sXG4gIH0pXG5cbiAgcmV0dXJuIHtcbiAgICBvcGVyYXRpb246ICdQdXRJdGVtJyxcbiAgICBrZXk6IHV0aWwuZHluYW1vZGIudG9NYXBWYWx1ZXMoe1xuICAgICAgaWQ6IHV0aWwuYXV0b0lkKCksXG4gICAgfSksXG4gICAgYXR0cmlidXRlVmFsdWVzOiB1dGlsLmR5bmFtb2RiLnRvTWFwVmFsdWVzKHtcbiAgICAgIC4uLmN0eC5hcmd1bWVudHMsXG4gICAgICBjcmVhdGVkQXQ6IHV0aWwudGltZS5ub3dJU084NjAxKCksXG4gICAgICB1cGRhdGVkQXQ6IHV0aWwudGltZS5ub3dJU084NjAxKCksXG4gICAgfSksXG4gICAgY29uZGl0aW9uOiB7XG4gICAgICBleHByZXNzaW9uOiAnYXR0cmlidXRlX25vdF9leGlzdHMoaWQpJyxcbiAgICB9LFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7OztBQUFxQyxTQUFTLFFBQVEsR0FBRTtBQUFDLFFBQU8sT0FBTyxNQUFJLFlBQVUsQ0FBQyxDQUFDLEtBQUcsT0FBTyxHQUFHLFdBQVM7O0FBQVMsU0FBUyxlQUFlLEdBQUUsR0FBRTtBQUFDLFFBQU8sRUFBRSxNQUFNLElBQUksQ0FBQyxRQUFRLEtBQUUsUUFBSTtBQUFDLFNB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RSxFQUFFLElBQUcsTUFBSSxRQUFRO0VBQUMsS0FBSTtFQUFVLEtBQUksU0FBUyxRQUFPLFlBQVksR0FBRSxFQUFFLElBQUcsRUFBRSxJQUFHLE1BQUksU0FBUztFQUFDLEtBQUksUUFBUSxRQUFPLFVBQVUsR0FBRSxHQUFHLEVBQUU7RUFBQyxLQUFJLEtBQUssUUFBTyxPQUFPLEdBQUUsR0FBRyxFQUFFO0VBQUMsS0FBSSxRQUFRLFFBQU8sVUFBVSxHQUFFLEdBQUcsRUFBRTtFQUFDLEtBQUk7RUFBUyxLQUFJLGdCQUFnQixRQUFPLFdBQVcsR0FBRSxFQUFFLElBQUcsTUFBSSxTQUFTO0VBQUMsS0FBSTtFQUFRLEtBQUksZUFBZSxRQUFPLFVBQVUsR0FBRSxFQUFFLElBQUcsTUFBSSxRQUFRO0VBQUMsS0FBSSxRQUFRLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBTSxFQUFDLE1BQU07RUFBQyxLQUFJLFFBQVEsUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFNLEVBQUMsTUFBTTtFQUFDLEtBQUksTUFBTSxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQUksRUFBQyxJQUFJO0VBQUMsS0FBSSxPQUFPLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBSyxFQUFDLEtBQUs7RUFBQyxLQUFJLE9BQU8sUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFLLEVBQUMsS0FBSztFQUFDLEtBQUksVUFBVSxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQVEsRUFBQyxRQUFRO0VBQUMsS0FBSSxPQUFPLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBSyxFQUFDLEtBQUs7RUFBQyxLQUFJLE9BQU8sUUFBTyxVQUFVO0dBQUMsR0FBRztHQUFFLEtBQUksRUFBRSxPQUFLLEVBQUUsT0FBTztHQUFLLEVBQUMsS0FBSztFQUFDLEtBQUksV0FBVyxRQUFPLFVBQVU7R0FBQyxHQUFHO0dBQUUsS0FBSSxFQUFFLE9BQUssRUFBRSxPQUFPO0dBQVMsRUFBQyxTQUFTO0VBQUMsS0FBSSxVQUFVLFFBQU8sVUFBVTtHQUFDLEdBQUc7R0FBRSxLQUFJLEVBQUUsT0FBSyxFQUFFLE9BQU87R0FBUSxFQUFDLFFBQVE7RUFBQyxRQUFRLFFBQU8sU0FBUyxHQUFFLEVBQUU7OztBQUFFLFNBQVMsWUFBWSxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxLQUFHLElBQUUsV0FBVSxJQUFFLFVBQVMsSUFBRSxPQUFNO0NBQUMsTUFBSyxDQUFDLEdBQUUsS0FBRyxDQUFDLE1BQUksVUFBUyxNQUFJLFVBQVU7Q0FBQyxNQUFNLElBQUU7RUFBQyxPQUFNO0VBQU0sS0FBSSxLQUFHLElBQUUsSUFBRSxFQUFFLGVBQWEsRUFBRSxZQUFVLElBQUUsSUFBRSxFQUFFLGNBQVksRUFBRSxZQUFVLElBQUUsRUFBRSxlQUFhLEVBQUU7RUFBYyxPQUFNO0VBQUUsUUFBTztHQUFDLFFBQU8sR0FBRztHQUFJLFFBQU8sR0FBRztHQUFJO0VBQUM7QUFBQyxLQUFHLE9BQU8sTUFBSSxTQUFTLEdBQUUsUUFBTSxJQUFFLElBQUUsS0FBRyxJQUFFLElBQUUsS0FBRyxLQUFHLEtBQUc7QUFBRSxLQUFHLE9BQU8sTUFBSSxVQUFTO0FBQUMsSUFBRSxRQUFNLEVBQUUsVUFBUSxLQUFHLEVBQUUsVUFBUTtBQUFFLElBQUUsTUFBSSxLQUFHLElBQUUsRUFBRSxZQUFVLElBQUUsRUFBRSxZQUFVLEVBQUU7O0FBQWMsS0FBRyxRQUFRLEVBQUUsRUFBQztBQUFDLElBQUUsUUFBTSxFQUFFLFVBQVEsS0FBRyxFQUFFLFVBQVE7QUFBRSxJQUFFLE1BQUksS0FBRyxJQUFFLEVBQUUsV0FBUyxJQUFFLEVBQUUsV0FBUyxFQUFFOztBQUFhLFFBQU87O0FBQUUsU0FBUyxVQUFVLEdBQUUsR0FBRyxHQUFFO0NBQUMsTUFBTSxJQUFFO0VBQUMsT0FBTTtFQUFNLEtBQUksRUFBRSxRQUFNLEVBQUUsV0FBUyxJQUFFLEVBQUUsT0FBTyxRQUFNLEVBQUUsT0FBTztFQUFnQixPQUFNLEVBQUU7RUFBTSxRQUFPLEVBQUUsV0FBUyxJQUFFLEVBQUMsWUFBVyxFQUFFLElBQUcsR0FBQyxFQUFDLGFBQVksRUFBRSxLQUFLLEtBQUssRUFBQztFQUFDO0FBQUMsS0FBRyxPQUFPLEVBQUUsVUFBUSxZQUFVLE9BQU8sRUFBRSxVQUFRLFVBQVM7RUFBQyxNQUFNLElBQUUsT0FBTyxFQUFFLFVBQVEsV0FBUyxFQUFFLFFBQU0sR0FBRyxFQUFFO0VBQVEsSUFBSSxJQUFFO0FBQU0sSUFBRSxTQUFRLFFBQUc7QUFBQyxPQUFHLEtBQUcsS0FBSyxRQUFRRSxLQUFFLEVBQUUsQ0FBQyxLQUFFO0lBQU07QUFBQyxJQUFFLFFBQU07O0FBQUUsUUFBTzs7QUFBRSxTQUFTLE9BQU8sRUFBQyxPQUFNLEdBQUUsS0FBSSxHQUFFLFFBQU8sS0FBRyxHQUFHLEdBQUU7QUFBQyxRQUFNO0VBQUMsT0FBTSxFQUFFLFNBQVMsRUFBRTtFQUFDLEtBQUksS0FBRyxFQUFFO0VBQUcsT0FBTTtFQUFFLFFBQU8sRUFBQyxPQUFNLEVBQUUsS0FBSyxLQUFLLEVBQUM7RUFBQzs7QUFBQyxTQUFTLFVBQVUsRUFBQyxPQUFNLEdBQUUsS0FBSSxHQUFFLFFBQU8sS0FBRyxHQUFHLEdBQUU7QUFBQyxRQUFNO0VBQUMsT0FBTSxDQUFDLEVBQUUsU0FBUyxFQUFFO0VBQUMsS0FBSSxLQUFHLEVBQUU7RUFBTSxPQUFNO0VBQUUsUUFBTyxFQUFDLFVBQVMsRUFBRSxLQUFLLEtBQUssRUFBQztFQUFDOztBQUFDLFNBQVMsYUFBYSxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxLQUFHO0NBQUMsTUFBTSxJQUFFO0VBQUMsT0FBTTtFQUFLLEtBQUksS0FBRyxFQUFFO0VBQVMsT0FBTTtFQUFFLFVBQVM7RUFBSztBQUFDLEtBQUcsT0FBTyxNQUFJLFNBQVMsR0FBRSxRQUFNLEVBQUUsU0FBTztBQUFFLEtBQUcsUUFBUSxFQUFFLENBQUMsR0FBRSxRQUFNLEVBQUUsU0FBTztBQUFFLEtBQUcsT0FBTyxNQUFJLFNBQVMsR0FBRSxRQUFNO0FBQUssS0FBRyxPQUFPLE1BQUksVUFBVSxHQUFFLFFBQU07QUFBSyxLQUFHLE9BQU8sTUFBSSxZQUFVLENBQUMsRUFBRSxNQUFNLEdBQUUsUUFBTTtBQUFNLEtBQUcsT0FBTyxNQUFJLFlBQVksR0FBRSxRQUFNO0FBQU0sR0FBRSxXQUFTLENBQUMsRUFBRTtBQUFNLFFBQU87O0FBQUUsU0FBUyxhQUFhLEVBQUMsT0FBTSxHQUFFLEtBQUksR0FBRSxRQUFPLEtBQUc7QUFBQyxRQUFNO0VBQUMsT0FBTTtFQUFLLEtBQUksS0FBRyxFQUFFO0VBQVMsT0FBTTtFQUFFLFVBQVMsT0FBTyxNQUFJLGVBQWEsTUFBSTtFQUFLOztBQUFDLFNBQVMsY0FBYyxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxHQUFFLFFBQU8sR0FBRSxLQUFJLEtBQUc7Q0FBQyxNQUFNLElBQUU7RUFBQyxPQUFNO0VBQUssS0FBSSxLQUFHLEVBQUU7RUFBVSxPQUFNO0VBQUU7QUFBQyxLQUFHLENBQUMsT0FBTyxPQUFPLEdBQUUsRUFBRSxFQUFDO0FBQUMsSUFBRSxXQUFTO0FBQUssU0FBTzs7QUFBRSxLQUFHLE9BQU8sTUFBSSxZQUFVLENBQUMsRUFBRSxPQUFNO0FBQUMsSUFBRSxRQUFNO0FBQU0sSUFBRSxXQUFTO0FBQUssU0FBTzs7QUFBRSxRQUFPLGFBQWE7RUFBQyxPQUFNO0VBQUUsS0FBSTtFQUFFLFFBQU87RUFBRSxDQUFDOztBQUFDLFNBQVMsU0FBUyxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxLQUFHLEdBQUU7Q0FBQyxNQUFNLElBQUU7RUFBQyxPQUFNO0VBQU0sS0FBSSxLQUFHLEVBQUU7RUFBSyxPQUFNO0VBQUUsUUFBTyxFQUFDLFNBQVEsR0FBRTtFQUFDO0FBQUMsU0FBTyxHQUFQO0VBQVUsS0FBSTtBQUFRLEtBQUUsUUFBTSxRQUFRLEVBQUU7QUFBQztFQUFNLEtBQUk7QUFBUyxLQUFFLFFBQU0sT0FBTyxNQUFJLFlBQVUsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBRSxPQUFPLEtBQUssRUFBRSxDQUFDLFNBQU87QUFBRTtFQUFNLEtBQUk7QUFBVSxLQUFFLFFBQU0sT0FBTyxNQUFJO0FBQVU7RUFBTSxLQUFJO0FBQVMsS0FBRSxRQUFNLE9BQU8sTUFBSTtBQUFTO0VBQU0sUUFBUSxHQUFFLFFBQU0sT0FBTyxNQUFJOztBQUFTLFFBQU87O0FBQUUsU0FBUyxXQUFXLEVBQUMsT0FBTSxHQUFFLEtBQUksR0FBRSxRQUFPLEtBQUcsR0FBRSxJQUFFLE9BQU07Q0FBQyxNQUFNLElBQUU7RUFBQyxPQUFNO0VBQU0sS0FBSSxLQUFHLEVBQUU7RUFBTyxPQUFNO0VBQUUsUUFBTyxJQUFFLEVBQUMsV0FBVSxHQUFFLEdBQUMsRUFBQyxrQkFBaUIsR0FBRTtFQUFDO0NBQUMsTUFBTSxJQUFFLEtBQUssS0FBSyxnQ0FBZ0MsRUFBRTtDQUFDLE1BQU0sSUFBRSxPQUFPLE1BQUksV0FBUyxLQUFLLEtBQUssZ0NBQWdDLEVBQUUsR0FBQztBQUFFLEtBQUcsT0FBTyxNQUFJLFNBQVMsR0FBRSxRQUFNLElBQUUsSUFBRSxJQUFFLEtBQUc7QUFBRSxRQUFPOztBQUFFLFNBQVMsVUFBVSxFQUFDLE9BQU0sR0FBRSxLQUFJLEdBQUUsUUFBTyxLQUFHLEdBQUUsSUFBRSxPQUFNO0NBQUMsTUFBTSxJQUFFO0VBQUMsT0FBTTtFQUFNLEtBQUksS0FBRyxJQUFFLEVBQUUsUUFBTSxFQUFFO0VBQWEsT0FBTTtFQUFFLFFBQU8sSUFBRSxFQUFDLFVBQVMsR0FBRSxHQUFDLEVBQUMsaUJBQWdCLEdBQUU7RUFBQztDQUFDLE1BQU0sSUFBRSxLQUFLLEtBQUssZ0NBQWdDLEVBQUU7Q0FBQyxNQUFNLElBQUUsT0FBTyxNQUFJLFdBQVMsS0FBSyxLQUFLLGdDQUFnQyxFQUFFLEdBQUM7QUFBRSxLQUFHLE9BQU8sTUFBSSxTQUFTLEdBQUUsUUFBTSxJQUFFLElBQUUsSUFBRSxLQUFHO0FBQUUsUUFBTzs7QUFBRSxTQUFTLE9BQU8sR0FBRTtBQUFDLFFBQU8sT0FBTyxNQUFJLFlBQVUsQ0FBQyxDQUFDLEtBQUcsT0FBTyxPQUFPLEdBQUUsUUFBUTs7QUFBQyxTQUFTLGlCQUFpQixHQUFFO0FBQUMsUUFBTyxPQUFPLE1BQUksWUFBVSxDQUFDLENBQUMsS0FBRyxPQUFPLE9BQU8sR0FBRSxPQUFPOztBQUFDLFNBQVMsU0FBUyxHQUFFLEdBQUUsR0FBRTtDQUFDLElBQUksSUFBRSxFQUFFO0NBQUMsTUFBTSxJQUFFO0VBQUMsR0FBRztFQUFXLEdBQUcsR0FBRztFQUFPO0FBQUMsS0FBRyxPQUFPLE1BQUksU0FBUyxNQUFLLE1BQU0sa0JBQWtCO0FBQUMscUJBQW9CLEdBQUUsRUFBRTtBQUFDLEtBQUcsR0FBRyxXQUFXLHFCQUFvQixHQUFFLEVBQUUsV0FBVztDQUFDLE1BQU0sSUFBRSxLQUFLLE1BQU0sS0FBSyxVQUFVLEVBQUUsQ0FBQztBQUFDLFFBQU8sS0FBSyxFQUFFLENBQUMsU0FBUSxNQUFHO0VBQUMsSUFBSUMsTUFBRSxlQUFlLEdBQUUsRUFBRTtFQUFDLE1BQU0sSUFBRSxFQUFFLE1BQU0sSUFBSSxDQUFDLFNBQU8sSUFBRSxlQUFlLEdBQUUsRUFBRSxNQUFNLElBQUksQ0FBQyxNQUFNLEdBQUUsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUM7QUFBRSxNQUFHLE9BQU9BLFFBQUksVUFBUztBQUFDLFNBQUUsWUFBWUEsS0FBRSxFQUFFO0FBQUMsa0JBQWUsR0FBRSxHQUFFQSxJQUFFOztFQUFDLElBQUksSUFBRTtFQUFNLE1BQU0sSUFBRSxFQUFFO0FBQUcsTUFBRyxHQUFHLE9BQU8sR0FBRSxTQUFRLE1BQUc7QUFBQyxPQUFHLEVBQUU7R0FBTyxNQUFNQyxNQUFFLE9BQU8sRUFBRSxHQUFDO0lBQUMsR0FBRztJQUFFLE9BQU1EO0lBQUUsS0FBSSxFQUFFLE9BQUssRUFBRTtJ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
