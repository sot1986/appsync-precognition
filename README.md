# appsync-precognition

Lean validation library for AppSync JS runtime, implementing Precognition protocol for real-time form validation.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
  - [Simple Validation](#simple-validation)
  - [Precognitive Validation (Real-time)](#precognitive-validation-real-time)
- [Validation Rules](#validation-rules)
  - [Basic Rules](#basic-rules)
  - [Type Rules](#type-rules)
  - [String Validation](#string-validation)
  - [Date/Time Validation](#datetime-validation)
  - [Numeric Validation](#numeric-validation)
  - [Size Constraints](#size-constraints)
  - [Pattern Matching](#pattern-matching)
  - [Date Comparisons](#date-comparisons)
- [Nested Object Validation](#nested-object-validation)
- [Array Validation](#array-validation)
- [Custom Error Messages](#custom-error-messages)
- [Custom Attribute Names](#custom-attribute-names)
- [Validation Options](#validation-options)
- [Precognitive Validation Features](#precognitive-validation-features)
  - [Client Integration](#client-integration)
- [Internationalization](#internationalization)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)
  - [Assert Validated Data](#assert-validated-data)
  - [Check Localization](#check-localization)

## Installation

```bash
npm install appsync-precognition
```

## Basic Usage

### Simple Validation
Any valid object can be validated, using simplified validation rules.

```javascript
import { validate } from 'appsync-precognition'

export function request(ctx) {
  const validatedArgs = validate({
    name: 'Marco',
    age: 15,
    email: 'marco@email.it',
  }, {
    name: ['required', ['min', 3]],
    age: ['required', ['min', 18]],
    email: ['required', 'email'],
    phone: ['sometimes', 'phone']
  })

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ id: util.autoId() }),
    attributeValues: util.dynamodb.toMapValues(validatedArgs)
  }
}
```
This validation will throw an Error of type `ValidationError`.

```typescript
util.error(
  'age min value is 18',
  'ValidationError',
  null,
  {
    path: 'age',
    value: 15
  }
)
```

### Precognitive Validation (Real-time)
If your frontend application supports precognitive validation like [Nuxt precognition](https://nuxt.com/modules/precognition), everything will be handled automatically.

```javascript
import { precognitiveValidation } from 'appsync-precognition'

export function request(ctx) {
  const validatedArgs = precognitiveValidation(ctx, {
    name: ['required', ['min', 3]],
    age: ['required', ['min', 18]],
    email: ['required', 'email'],
    phone: ['nullable', 'phone']
  })

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ id: util.autoId() }),
    attributeValues: util.dynamodb.toMapValues(validatedArgs)
  }
}
```
1. Module checks for precognition headers and/or keys.
2. Validates the request payload accordingly
3. In case of success and precognitive requests, it will immediately return with `{ data: null, errors: undefined }`

## Validation Rules

### Basic Rules
- `required` - Field must have a value
- `nullable` - Field can be null but validates if present
- `sometimes` - Field is optional but validates if present

### Type Rules
- `string` - Must be a string
- `number` - Must be a number
- `boolean` - Must be a boolean
- `array` - Must be an array
- `object` - Must be an object

### String Validation
- `email` - Valid email format
- `phone` - Valid phone number (+123...)
- `url` - Valid URL format
- `uuid` - Valid UUID format
- `ulid` - Valid ULID format

### Date/Time Validation
- `date` - Valid date (YYYY-MM-DD)
- `time` - Valid time (HH:MM:SS)
- `datetime` - Valid ISO datetime

### Numeric Validation
- `integer` - Valid integer
- `numeric` - Valid number format

### Size Constraints
- `['min', number]` - Minimum value/length
- `['max', number]` - Maximum value/length
- `['between', min, max]` - Between values (inclusive)
- `['bigger', number]` - Strictly greater than
- `['lower', number]` - Strictly less than
- `['within', min, max]` - Strictly between values

### Pattern Matching
- `['regex', pattern]` - Match regex pattern
- `['in', ...values]` - Value must be in list
- `['notIn', ...values]` - Value must not be in list

### Date Comparisons
- `['before', date]` - Before specified date
- `['after', date]` - After specified date
- `['beforeOrEqual', date]` - Before or equal to date
- `['afterOrEqual', date]` - After or equal to date

## Nested Object Validation

```javascript
const validatedArgs = validate(ctx.args, {
  'user.name': ['required', ['min', 3]],
  'user.email': ['required', 'email'],
  'address.street': ['required'],
  'address.zipCode': ['required', ['between', 5, 10]]
})
```

## Array Validation

To simplify error rules definition, the shortcut `*` is supported.

```javascript
const validatedArgs = validate(ctx.args, {
  'hobbies': ['required', 'array', ['min', 1]],
  'hobbies.*': ['required', 'string', ['max', 50]], // Validates each array item
  'tags': ['sometimes', 'array'],
  'tags.*.value': ['string']
})
```

## Custom Error Messages

```javascript
const validatedArgs = validate(ctx.args, {
  email: [{ rule: 'email', msg: 'Please enter a valid email address' }],
  age: [{ rule: ['min', 18], msg: 'You must be at least 18 years old' }]
})
```

## Custom Attribute Names
Attribute names can be customized by adding a third parameter to the `validate` function.

```javascript
const validatedArgs = validate(ctx.args, {
  'email': ['required', 'email'],
  'phone': ['required', 'phone'],
  'hobbies.*': ['required', ['min', 2]] // each hobbies should have at least 2 chars
}, {
  attributes: {
    ':email': 'Email Address',
    ':phone': 'Phone Number',
    ':hobbies.*': 'Hobby' // 'Hobby must have at least 2 characters'
  }
})
```

## Validation Options

```javascript
const validatedArgs = validate(ctx.args, rules, {
  trim: true, // Trim string values (default: true)
  allowEmptyString: false, // Allow empty strings (default: false)
  errors: {
    required: ':attr is mandatory',
    email: ':attr must be a valid email'
  },
  attributes: {
    ':email': 'Email Address'
  }
})
```

## Precognitive Validation Features

The `precognitiveValidation` function automatically handles:
- **Full validation** when `precognition` header is not present
- **Selective validation** when `precognition-validate-only` header specifies fields
- **Early return** for precognitive requests with proper headers
- **Response headers** for client-side precognition handling

### Client Integration

Your frontend should send these headers for precognitive validation:
```json
{
  "Precognition": "true",
  "Precognition-Validate-Only": "email,name"
}
```

In addition, these headers must be enabled in the CORS policy of AppSync.

## Internationalization

```javascript
import { localize } from 'appsync-precognition/i18n'

export function request(ctx) {
  // Set up localization based on Accept-Language header
  localize(ctx, {
    errors: {
      en: { required: ':attr is required' },
      es: { required: ':attr es requerido' },
      it: { required: 'il campo :attr è obbligatorio' }
    },
    attributes: {
      en: { ':name': 'Name', ':email': 'Email' },
      es: { ':name': 'Nombre', ':email': 'Correo' },
      it: { ':name': 'Nome', ':email': 'Email' }
    }
  }) // locale details will be added in stash object

  const validatedArgs = precognitiveValidation(ctx, {
    name: ['required'],
    email: ['required', 'email']
  })

  return { /* your operation */ }
}
```
If needed, it can be useful to split the localization and validation in separate resolvers of the same pipeline.

## Error Handling

Validation errors are thrown as AppSync errors with detailed information:

```javascript
// When validation fails, the error contains:
// - message: Human-readable error message
// - errorType: 'ValidationError'
// - errorInfo: { path: 'field.name', value: invalidValue }
```

## Advanced Usage

### Assert Validated Data

```javascript
import { assertValidated } from 'appsync-precognition'

export function request(ctx) {
  precognitiveValidation(ctx, rules)
  return { /* operation */ }
}

export function response(ctx) {
  assertValidated(ctx) // Ensures validation was performed
  return ctx.stash.__validated
}
```

### Check Localization

```javascript
import { assertLocalized, isLocalized } from 'appsync-precognition'

export function request(ctx) {
  if (isLocalized(ctx, 'es')) {
    // Handle Spanish localization
  }

  assertLocalized(ctx) // Throws if not localized
}
```
