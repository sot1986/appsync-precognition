import { n as NestedKeyOf, r as Rule, t as FullRule } from "./types-1ORDfyL5.js";

//#region src/index.d.ts
declare function validate<T extends { [key in keyof T & string]: T[key] }>(obj: Partial<T>, checks: Partial<Record<NestedKeyOf<T>, (FullRule | Rule<T>)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
}): T;
declare function precognitiveValidation<T extends { [key in keyof T & string]: T[key] }>(ctx: {
  request: {
    headers: any;
  };
  args: Partial<T>;
}, checks: Partial<Record<NestedKeyOf<T>, (FullRule | Rule<T>)[]>>, options?: {
  trim?: boolean;
  allowEmptyString?: boolean;
  skipTo?: "END" | "NEXT";
}): T;
declare function formatAttributeName(path: string): string;
//#endregion
export { formatAttributeName, precognitiveValidation, validate };