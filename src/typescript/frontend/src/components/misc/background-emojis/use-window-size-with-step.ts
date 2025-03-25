import { useMemo } from "react";
import useWindowSize from "react-use/lib/useWindowSize";

const STEP_SIZE = 222;

// Round the input value down to the nearest multiple of STEP_SIZE.
const stepFn = (value: number) => Math.floor(value / STEP_SIZE) * STEP_SIZE;

/**
 * Returns window dimensions that only update when crossing step boundaries.
 * Prevents excessive re-renders during window resizing.
 */
export const useWindowSizeWithStep = () => {
  const { width, height } = useWindowSize();

  return useMemo(
    () => ({
      width: stepFn(width),
      height: stepFn(height),
    }),
    [width, height]
  );
};
