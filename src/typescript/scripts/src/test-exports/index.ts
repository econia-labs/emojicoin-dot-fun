// The jest `expect` is called in test utilities. Ensure that even when chained, it doesn't fail.
// @ts-expect-error Overriding the global expect.
global.expect = (_) => ({
  toEqual: () => {},
  toBe: () => {},
  toBeTruthy: () => {},
  toBeFalsy: () => {},
  toBeDefined: () => {},
  toBeNull: () => {},
  toContain: () => {},
  toHaveLength: () => {},
  not: {
    toEqual: () => {},
    toBe: () => {},
    toBeTruthy: () => {},
    toBeFalsy: () => {},
    toBeDefined: () => {},
    toBeNull: () => {},
    toContain: () => {},
    toHaveLength: () => {},
  },
});

export * from "./arena-utils";
export * from "./test-accounts";
