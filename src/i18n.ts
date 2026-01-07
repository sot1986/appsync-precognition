import type { DefinedRecord, NestedKeyOf, ValidationErrors } from './types'
import { getHeader } from './utils'

export function localize<
  TLocales extends string[],
  T extends object,
>(
  ctx: { args?: Partial<T>, request: { headers: any }, stash: Record<string, any> },
  i18n?: {
    errors?: Record<TLocales[number], DefinedRecord<Partial<ValidationErrors>>>
    attributes?: Record<TLocales[number], DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>>
  },
): void {
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
  }
}
