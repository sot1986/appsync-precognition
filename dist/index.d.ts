import { Context } from "@aws-appsync/utils";

//#region rolldown:runtime
//#endregion
//#region src/types.d.ts
interface Rule<T = unknown> {
  check: boolean;
  message: string;
  value: T;
}
type ShortRule<T extends string> = T | `${T}:${string}`;
type ArrayKeys<T extends unknown[]> = T extends [unknown, ...unknown[]] ? T extends Record<infer Index, unknown> ? Index extends `${number}` ? Index : never : never : `${number}`;
type ObjectKeys<T extends object> = T extends unknown[] ? ArrayKeys<T> : keyof T & string;
interface HasConstructor {
  new (...args: unknown[]): unknown;
}
type NestedKeyOf<T> = T extends Record<infer Key, unknown> ? T extends HasConstructor ? never : T extends CallableFunction ? never : Key extends string | number ? (ObjectKeys<T> | (T[Key] extends object ? `${ObjectKeys<Pick<T, Key>>}.${NestedKeyOf<T[Key]>}` : T extends unknown[] ? T extends [unknown, ...unknown[]] ? never : T[number] extends object ? `${number}.${NestedKeyOf<T[number]>}` : never : never)) : never : never;
declare namespace rules_d_exports {
  export { names, parse, requiredRule };
}
declare const names: {
  readonly required: "required";
  readonly nullable: "nullable";
  readonly sometimes: "sometimes";
  readonly min: "min";
  readonly max: "max";
  readonly between: "between";
  readonly email: "email";
  readonly url: "url";
  readonly uuid: "uuid";
  readonly regex: "regex";
  readonly in: "in";
  readonly notIn: "notIn";
  readonly before: "before";
  readonly after: "after";
};
declare function parse<T>(value: T, rule: ShortRule<keyof typeof names>): Rule<T>;
declare function requiredRule<T>(value: T, ..._params: string[]): Rule<T>;
//#endregion
//#region src/index.d.ts
declare function validate<T extends object>(obj: T, checks: Partial<Record<NestedKeyOf<T>, (ShortRule<keyof typeof rules_d_exports["names"]> | Rule)[]>>): T;
declare function precognition<T extends object>(ctx: Context<T>, checks: Partial<Record<NestedKeyOf<T>, (ShortRule<keyof typeof rules_d_exports["names"]> | Rule)[]>>): T;
//#endregion
export { precognition, validate };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguZC50cyIsIm5hbWVzIjpbXSwic291cmNlcyI6WyIuLi9zcmMvdHlwZXMudHMiLCIuLi9zcmMvcnVsZXMudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7VUFFaUI7OztTQUdSOztLQUdHLDhCQUE4QixPQUFPO0tBRTVDLGlDQUNELG9DQUNFLFVBQVU7S0FPWCwrQkFDRCxzQkFDRSxVQUFVLFdBQ0o7VUFFRixjQUFBOzs7S0FJRSxpQkFBaUIsVUFBVSw2QkFDbkMsVUFBVSx5QkFFUixVQUFVLDBEQUdMLFdBQVcsTUFBTSxFQUFFLHlCQUNiLFdBQVcsS0FBSyxHQUFHLFNBQVMsWUFBWSxFQUFFLFVBQzdDLHNCQUNFLDRDQUVFLHdDQUNlLFlBQVk7Ozs7Y0NwQ2hDOzs7Ozs7Ozs7Ozs7Ozs7O2lCQWlCRyxnQkFBZ0IsU0FBUyx1QkFBdUIsU0FBUyxLQUFLO2lCQXVLOUQsdUJBQXVCLDBCQUEwQixLQUFLOzs7aUJDdEx0RCxnQ0FDVCxXQUNHLFFBQVEsT0FBTyxZQUFZLEtBQUssdUJBQXVCLDRCQUFrQixZQUNoRjtpQkEyQ2Esb0NBQ1QsUUFBUSxZQUNMLFFBQVEsT0FBTyxZQUFZLEtBQUssdUJBQXVCLDRCQUFrQixZQUNoRiJ9