export const isNullish = <T>(v: T): v is Extract<T, null | undefined> =>
  v === null || typeof v === "undefined";
/**
 * @see {@link Option}
 */
class _Option<T> {
  private constructor(private readonly value: T | null | undefined) {}

  /**
   * To achieve referential equality (and avoid re-renders in state management libraries), create a
   * static `None` object to use.
   */
  private static readonly NONE = Object.freeze(new _Option(null));

  static none<T>(): _Option<T> {
    return _Option.NONE as unknown as _Option<T>;
  }

  static from<T>(value: T | null | undefined): _Option<T> {
    if (isNullish(value)) {
      return _Option.none();
    }
    return new _Option(value);
  }

  unwrap(): NonNullable<T> {
    if (this.value === undefined || this.value === null) {
      throw new Error("Unwrapped a nullish value");
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
    if (isNullish(defaultValue)) {
      throw new Error("The value passed to `unwrapOr` cannot be a nullish value");
    }
    return this.value !== null && this.value !== undefined ? this.value : defaultValue;
  }

  @Lazy
  map<U>(fn: (value: T) => U): _Option<NonNullable<U>> {
    if (this.value === null || this.value === undefined || isNullish(fn)) {
      return _Option.none<NonNullable<U>>();
    }
    const result = fn(this.value);
    return result === null || result === undefined
      ? _Option.none<NonNullable<U>>()
      : _Option.from(result);
  }

  mapOr<U extends void | NonNullable<unknown>>(defaultValue: U, fn: (value: T) => U): U {
    return isNullish(this.value) ? defaultValue : fn(this.value);
  }

  mapOrElse<U extends void | NonNullable<unknown>>(defaultFn: () => U, fn: (value: T) => U): U {
    if (isNullish(this.value)) {
      return defaultFn();
    }
    return fn(this.value);
  }

  @Lazy
  and<U extends NonNullable<unknown>>(optb: _Option<U> | U | null | undefined): _Option<U> {
    return this.isNone()
      ? _Option.none()
      : optb instanceof _Option
        ? optb
        : isNullish(optb)
          ? _Option.none<U>()
          : _Option.from(optb);
  }

  @Lazy
  andThen<U extends NonNullable<unknown>>(
    fn: (value: T) => _Option<U> | U | null | undefined
  ): _Option<U> {
    if (isNullish(this.value) || isNullish(fn)) {
      return _Option.none<U>();
    }

    const result = fn(this.value);

    return result instanceof _Option
      ? (result as _Option<NonNullable<U>>)
      : result === null || result === undefined
        ? _Option.none()
        : _Option.from(result);
  }

  @Lazy
  filter(fn: (value: NonNullable<T>) => boolean): _Option<T> {
    if (this.value === null || this.value === undefined || isNullish(fn)) {
      return _Option.none<T>();
    }
    return fn(this.value) === true ? this : _Option.none<T>();
  }

  inspect(fn: (value: NonNullable<T>) => void): this {
    if (this.value !== null && this.value !== undefined && !isNullish(fn)) {
      fn(this.value);
    }
    return this;
  }

  @Lazy
  zip<U>(otherIn: _Option<U> | U | null | undefined): _Option<[T, U]> {
    const other = otherIn instanceof _Option ? otherIn.unwrap() : otherIn;
    return other === null || other === undefined || this.value === null || this.value === undefined
      ? _Option.none<[T, U]>()
      : _Option.from([this.value, other]);
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

export const collectSome = <T>(arr: OptionType<T>[]): T[] =>
  arr.filter((opt) => opt.isSome()).map((some) => some.unwrap());

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A decorator to lazily evaluate functions that operate on an Option, short-circuiting and
 * returning None if the current Option value is None.
 */
function Lazy(
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // Short-circuit if the current value is nullish.
    if (isNullish(this.value)) {
      return _Option.none();
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
