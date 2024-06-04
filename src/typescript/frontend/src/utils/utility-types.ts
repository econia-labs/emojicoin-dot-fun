
/**
 * A utility type that requires at least one of the properties.
 * @example
 * type Example = AtLeastOne<{ a: string; b: number }>; // { a: string } | { b: number }
 */
export type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]: T[P] } & Partial<Omit<T, K>>
  : never;
