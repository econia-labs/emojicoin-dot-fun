import { useMemo } from "react";
import useWindowSize from "react-use/lib/useWindowSize";

/**
 * Rounds a numeric value down to the nearest multiple of the specified step size.
 * @param value - The numeric value to quantize
 * @param step - The step size to quantize to
 * @returns The value rounded down to the nearest step
 */
const stepFn = (value: number, step: number) => Math.floor(value / step) * step;

/** Default pixel threshold before dimensions update */
const DEFAULT_STEP_SIZE = 100;

/**
 * Returns window dimensions that only update when crossing step boundaries.
 *
 * This hook prevents excessive re-renders during window resizing by "quantizing"
 * dimensions to specific step increments. The returned width and height
 * only change when the actual window dimensions cross these step thresholds.
 *
 * @param stepSize - Optional step size in pixels. Controls how much the window must resize before
 *                   triggering an update. Defaults to {@link DEFAULT_STEP_SIZE}
 *
 * @example
 * ```tsx
 * // Basic usage with default step size
 * function ResponsiveGrid() {
 *   const { width, height } = useSteppedWindowSize();
 *   return <Grid columns={Math.ceil(width / 200)} rows={Math.ceil(height / 150)} />;
 * }
 *
 * // Custom step size of 50px for finer control
 * function PreciseLayout() {
 *   const { width, height } = useSteppedWindowSize(50);
 *   return <Layout width={width} height={height} />;
 * }
 * ```
 *
 * @returns Object containing stepped width and height values
 */
export const useRoughWindowSize = (stepSize: number = DEFAULT_STEP_SIZE) => {
  const { width, height } = useWindowSize();

  return useMemo(
    () => ({
      width: stepFn(width, stepSize),
      height: stepFn(height, stepSize),
    }),
    [width, height, stepSize]
  );
};
