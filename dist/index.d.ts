import { a as FullRule, c as Rule, l as ValidationErrors, n as CustomFullRule, o as LocalizedCtx, r as DefinedRecord, s as NestedKeyOf, t as Ctx } from "./types-CN3uACtN.js";

//#region src/index.d.ts
declare function validate<T extends object>(obj: Partial<T>, checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Omit<Rule<T>, "value">)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
  errors?: DefinedRecord<Partial<ValidationErrors>>;
  attributes?: DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>;
}): T;
declare function precognitiveValidation<T extends object>(ctx: Ctx<T>, checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule | Rule<T>)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
  skipTo?: "END" | "NEXT";
  errors?: DefinedRecord<Partial<ValidationErrors>>;
  attributes?: DefinedRecord<Partial<Record<`:${NestedKeyOf<T>}`, string>>>;
}): T;
declare function formatAttributeName(path: string): string;
declare function assertValidated<T extends object>(ctx: Ctx<T>): asserts ctx is Ctx<T> & {
  stash: {
    __validated: T;
  };
};
declare function isLocalized<T extends object>(ctx: Ctx<T>): ctx is LocalizedCtx<T>;
//#endregion
export { assertValidated, formatAttributeName, isLocalized, precognitiveValidation, validate };