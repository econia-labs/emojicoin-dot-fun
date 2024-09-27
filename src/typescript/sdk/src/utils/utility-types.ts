// cspell:word typeparam
/* eslint-disable import/no-unused-modules */

/**
 * A utility type that requires at least one of the properties.
 * @example
 * type Example = AtLeastOne<{ a: string; b: number }>; // { a: string } | { b: number }
 */
export type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]: T[P] } & Partial<Omit<T, K>>
  : never;

/**
 * A utility type that extracts the types of the values in an object `T`.
 * It creates a union type of all the property values of `T`.
 *
 * @typeparam T - The object type from which value types are extracted.
 *
 * Usage Example:
 * ```typescript
 * const ORDER_BY = {
 *   id: 'ASC',
 *   name: 'DESC',
 *   count: 100
 * };
 *
 * type OrderByValues = ValueOf<typeof ORDER_BY>; // 'ASC' | 'DESC' | 100
 * ```
 */
export type ValueOf<T> = T[keyof T];

export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DeepWritable<T> = {
  -readonly [P in keyof T]: DeepWritable<T[P]>;
};
