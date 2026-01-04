import { describe, expect, it, vi } from 'vitest'
import { formatAttributeName } from '../src/index'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe.concurrent('test formatAttributeName utility', () => {
  it.concurrent.each([
    ['name', 'name'],
    ['firstName', 'first name'],
    ['lastName', 'last name'],
    ['emailAddress', 'email address'],
    ['phoneNumber', 'phone number'],
    ['userID', 'user i d'],
    ['XMLHttpRequest', 'x m l http request'],
  ])('formats camelCase to readable names', (input, expected) => {
    const result = formatAttributeName(input)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['user.name', 'user name'],
    ['user.firstName', 'user first name'],
    ['address.streetName', 'address street name'],
    ['person.contact.emailAddress', 'person contact email address'],
  ])('formats nested paths to readable names', (input, expected) => {
    const result = formatAttributeName(input)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['users.0.name', 'users name'],
    ['items.1.title', 'items title'],
    ['data.0.firstName', 'data first name'],
    ['array.10.value', 'array value'],
  ])('skips numeric indices in paths', (input, expected) => {
    const result = formatAttributeName(input)
    expect(result).toBe(expected)
  })

  it.concurrent.each([
    ['', ''],
    ['a', 'a'],
    ['A', 'a'],
    ['0', ''],
    ['123', ''],
  ])('handles edge cases', (input, expected) => {
    const result = formatAttributeName(input)
    expect(result).toBe(expected)
  })
})
