import type { Context } from '@aws-appsync/utils'
import { util } from '@aws-appsync/utils'
import { validate } from '@sot1986/appsync-validator'

interface User {
  name: string
  age: number
  email: string
  address?: {
    street: string
    city: string
    country: string
  }
}

export function request(ctx: Context<User>) {
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
    key: util.dynamodb.toMapValues({
      id: util.autoId(),
    }),
    attributeValues: util.dynamodb.toMapValues({
      ...ctx.arguments,
      createdAt: util.time.nowISO8601(),
      updatedAt: util.time.nowISO8601(),
    }),
    condition: {
      expression: 'attribute_not_exists(id)',
    },
  }
}
