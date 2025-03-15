/**
 * @see {@link Option}
 */
export class _Option<T> {
  private constructor(private readonly value: T | null | undefined) {}

  static none<T>(): _Option<T> {
    return new _Option<T>(undefined);
  }

  static from<T>(value: T | null | undefined): _Option<T> {
    return new _Option(value);
  }

  unwrap(err?: string): NonNullable<T> {
    if (this.value === null || this.value === undefined) {
      throw new Error(err || "Expected a value");
    }
    return this.value;
  }

  expect(err: string): NonNullable<T> {
    if (this.value === null || this.value === undefined) {
      throw new Error(err);
    }
    return this.value;
  }

  unwrapOr(defaultValue: NonNullable<T>): NonNullable<T> {
    return this.value !== null && this.value !== undefined ? this.value : defaultValue;
  }

  map<U>(fn: (value: T) => U): _Option<U> {
    if (this.value === null || this.value === undefined) {
      return _Option.none<U>();
    }
    return _Option.from(fn(this.value));
  }

  isSome(): boolean {
    return this.value !== null && this.value !== undefined;
  }

  isNone(): boolean {
    return this.value === null || this.value === undefined;
  }
}

/**
 * A Rust-inspired Option type for safer nullish handling in TypeScript.
 *
 * Wraps potentially null/undefined values with safe transformation methods to avoid repetitive null
 * checks.
 *
 * Example:
 * ```
 * // Without Option - verbose error handling
 * const user = userMap.get(id);
 * if (!user) throw new Error("This will never happen.");
 * const profile = user.profile;
 * if (!profile) throw new Error("Definitely exists");
 *
 * // With Option - clean and chainable
 * const profile = Option(userMap.get(id))
 *   .map(user => user.profile)
 *   .unwrap("User profile not found");
 * ```
 */
export const Option = <T>(value: T | null | undefined) => _Option.from(value);
export const None = <T>() => _Option.none<T>();
export type OptionType<T> = ReturnType<typeof Option<T>>;
