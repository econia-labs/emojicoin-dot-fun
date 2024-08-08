import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * This is a shim for `useEffectLayout` since we can't use it yet- it's in the experimental
 * build of React.
 *
 * It's a way to call `useEffect` with a stable function reference that doesn't change on every
 * render.
 *
 * Basically, if you need to trigger a callback function on a specific dependency in a `useEffect`,
 * but you need the callback to be in the dependencies *without* triggering the effect, you can use
 * this hook.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function useEvent<T extends any[]>(fn: (...args: T) => void) {
  const ref = useRef<((...args: T) => void) | null>(null);

  useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: T) => {
    const f = ref.current;
    if (f) {
      return f(...args);
    }
  }, []);
}

export default useEvent;
