import type { Ctx, DefinedRecord, LocalizedCtx, NestedKeyOf, ValidationErrors } from './types'
import { getHeader } from './utils'

export function localize<
  T extends object,
>(
  ctx: Ctx<T>,
  i18n?: {
    errors?: Record<string, DefinedRecord<Partial<ValidationErrors>>>
    attributes?: Record<string, DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>>
  },
): asserts ctx is Ctx<T> & LocalizedCtx<T, string> {
  const locale = getHeader('Accepted-Language', ctx)
  if (locale) {
    ctx.stash.__i18n = {
      locale,
      errors: i18n?.errors && Object.hasOwn(i18n.errors, locale)
        ? i18n.errors[locale as keyof typeof i18n.errors]
        : undefined,
      attributes: i18n?.attributes && Object.hasOwn(i18n.attributes, locale)
        ? i18n.attributes[locale as keyof typeof i18n.attributes]
        : undefined,
    }
    return
  }
  ctx.stash.__i18n = {
    locale: 'en',
    errors: i18n?.errors?.en,
    attributes: i18n?.attributes?.en,
  }
}
