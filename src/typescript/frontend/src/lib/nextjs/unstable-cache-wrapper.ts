/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { APTOS_NETWORK } from "lib/env";
import { unstable_cache } from "next/cache";

type Callback = (...args: any[]) => Promise<any>;

/**
 * A more stable version of `unstable_cache`, achieved with a proxy object to update the callback
 * function's `.toString()` function and `.name` field.
 */
export function unstableCacheWrapper<T extends Callback>(
  cb: T,
  /**
   * The unique function label. The args are serialized and added to the cache key generator at
   * runtime, so the only thing necessary here is a unique identifier for the query/function itself.
   */
  uniqueFunctionLabel: Exclude<string, "">,
  options: {
    /** The revalidation interval in seconds. */
    revalidate?: number | false;
    extraTags?: string[];
  }
): T {
  if (!uniqueFunctionLabel.length) {
    throw new Error(`You must provide a unique function key label. Got: ${uniqueFunctionLabel}`);
  }

  // Add the `uniqueKey` to the `tags` array if it's not already there.
  const staticTags = new Set([uniqueFunctionLabel, ...(options?.extraTags ?? [])]);
  const baseTags = Array.from(staticTags);

  // Stabilize the final callback and call `unstable_cache` with it.
  const stabilizedWithExplicitTags = async (...args: any[]) => {
    const functionCallTag = prettifyFunctionCall(uniqueFunctionLabel, ...args);
    // Only add the function call tag if there are args, otherwise it's the same as the label.
    const tags = !args.length ? baseTags : [...baseTags, functionCallTag];
    const stabilizedProxy = createStabilizedProxy(cb, uniqueFunctionLabel);
    return unstable_cache(stabilizedProxy, [uniqueFunctionLabel], {
      revalidate: options.revalidate,
      tags,
    })(...args);
  };

  return stabilizedWithExplicitTags as T;
}

/**
 * Prettify a function call invocation by sanitizing and formatting its name and its arg inputs.
 * This makes it easy to debug and revalidate/invalidate invocations with specific arguments.
 */
function prettifyFunctionCall(uniqueKey: string, ...args: any[]) {
  const encodedArgs = JSON.stringify(args, (_, v) =>
    typeof v === "string" ? encodeURIComponent(v) : v
  );
  const argsWithoutParens = encodedArgs.replace(/^\[(.*)\]$/, "$1");
  return `${uniqueKey}(${argsWithoutParens})`;
}

/**
 * Creates a proxy object for a function and updates the proxy's `.toString()` and `.name` fields to
 * return the passed in cache key instead.
 *
 * The `cb.toString()` function used in the cache key generation in `unstable_cache` is
 * unreliable and sometimes even results in different keys for the same exact function due to
 * code minification.
 *
 * e.g., `() => func.a();` might minify to `() => func.o();` non-deterministically.
 *
 * To fix this, this function creates a Proxy object on the underlying callback function and updates
 * its `.toString()` function. This facilitates stabilizing the cache key generation inside
 * `unstable_cache` without having to rely on side effects from altering the underlying cb object.
 *
 * This fixes the issue of non-deterministic keys generated for the `unstable_cache` function.
 */
export function createStabilizedProxy<T extends Callback>(cb: T, uniqueKey: string): T {
  return new Proxy(cb, {
    get(target, prop, receiver) {
      if (prop === "toString") return () => `${uniqueKey}__${APTOS_NETWORK}`;
      if (prop === "name") return `${uniqueKey}__${APTOS_NETWORK}`;
      return Reflect.get(target, prop, receiver);
    },
  });
}
