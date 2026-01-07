import type { Ctx, ValidationErrors } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { assertLocalized, isLocalized, precognitiveValidation } from '../src'
import { localize } from '../src/i18n'
import { assertAppsyncError } from './mocks'

// Mock the @aws-appsync/utils module
vi.mock('@aws-appsync/utils', async () => {
  const { mockUtil } = await import('./mocks')
  return {
    util: mockUtil(),
  }
})

describe('test errors customization behaviour', () => {
  it.each([
    'it' as 'it' | 'de',
    'de' as 'it' | 'de',
  ])('apply translated errors on ctx stash property when accepted-language header is present', (lang: 'it' | 'de') => {
    const i18n = {
      errors: {
        it: {
          required: 'il campo :attr è obbligatorio',
          minNumber: 'il valore minimo per :attr è :min',
        },
        de: {
          required: 'das Feld :attr ist erforderlich',
          minNumber: 'der Mindestwert für :attr ist :min',
        },
      },
      attributes: {
        it: {
          ':age': 'età',
        },
        de: {
          ':age': 'Alter',
          ':name': 'Name',
        },
      },
    }
    const args = { name: 'Marco', age: 15 }
    const ctx: Ctx<typeof args> = {
      args,
      request: { headers: { 'accepted-language': lang } },
      stash: {},
    }
    localize(ctx, i18n)
    try {
      assertLocalized(ctx)
      expect(ctx.stash.__i18n.locale).toBe(lang)

      precognitiveValidation(ctx, {
        age: ['required', 'number', 'integer', ['min', 18]],
      })

      expect(true).toBe(false)
    }
    catch (error) {
      assertAppsyncError(error)
      expect(error.errors.length).toBe(1)
      expect(error.errors[0].msg).toBe(
        i18n.errors[lang].minNumber.replace(':attr', i18n.attributes[lang][':age']).replace(':min', '18'),
      )
    }
  })
})
