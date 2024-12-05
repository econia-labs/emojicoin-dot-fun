export * from "./core";
export { type default as JsonTypes } from "./json-types";
export * from "./postgrest-types";
export * from "./types";

/**
 * Flatten a type to remove any nested properties from unions and intersections.
 * {@link https://twitter.com/mattpocockuk/status/1622730173446557697}
 */
export type Flatten<T> = { [K in keyof T]: T[K] } & NonNullable<unknown>;
