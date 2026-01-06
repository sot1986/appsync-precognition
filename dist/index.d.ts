import { a as Rule, i as NestedKeyOf, o as ValidationErrors, r as FullRule, t as CustomFullRule } from "./types-zu_QN-gu.js";

//#region src/index.d.ts
declare function validate<T extends { [key in keyof T & string]: T[key] }>(obj: Partial<T>, checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule<T> | Rule<T>)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
  errors?: Partial<ValidationErrors>;
}): T;
declare function precognitiveValidation<T extends { [key in keyof T & string]: T[key] }>(ctx: {
  request: {
    headers: any;
  };
  args: Partial<T>;
  stash: Record<string, any>;
}, checks: Partial<Record<NestedKeyOf<T>, (FullRule | CustomFullRule<T> | Rule<T>)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
  skipTo?: "END" | "NEXT";
}): T;
declare function formatAttributeName(path: string): string;
declare function assertValidated<T extends { [key in keyof T & string]: T[key] }>(ctx: {
  request: {
    headers: any;
  };
  args: Partial<T>;
  stash: Record<string, any>;
}): asserts ctx is {
  request: {
    headers: any;
  };
  args: Partial<T>;
  stash: Record<string, any> & {
    __validated: T;
  };
};
//#endregion
export { assertValidated, formatAttributeName, precognitiveValidation, validate };