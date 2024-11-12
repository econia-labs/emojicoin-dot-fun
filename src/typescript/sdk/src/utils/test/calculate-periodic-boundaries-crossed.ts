import { type Period, periodEnumToRawDuration, PERIODS } from "../../const";
import { type AnyNumberString } from "../../types";
import { getPeriodBoundary } from "../misc";

/**
 * Calculates the number of period boundaries crossed between two times. Since this will always
 * be in ascending order of period boundary size, we just return the number of boundaries, not
 * which specific ones.
 *
 * For example, (assume both times have the same date), 01:01:13 and 01:01:59 will cross 0 period
 * boundaries.
 *
 * But 01:01:13 and 01:02:00 will cross 1 period boundary (a 1-minute period).
 *
 * 01:01:13 01:05:00 will cross a 1-minute and 5-minute period boundary.
 *
 * 01-01-2000 11:59:59 and 01-02-2000 12:00:00 will cross all period boundaries:
 * 1m, 5m, 15m, 30m, 1h, 4h, and 1d.
 *
 * @param startMicroseconds the number/bigint/string start time in microseconds.
 * @param endMicroseconds the number/bigint/string end time in microseconds.
 * @returns the number of period boundaries crossed.
 * @throws if the end time is later than the start time.
 */
export const calculatePeriodBoundariesCrossed = ({
  startMicroseconds,
  endMicroseconds,
}: {
  startMicroseconds: AnyNumberString;
  endMicroseconds: AnyNumberString;
}): number => {
  const start = BigInt(startMicroseconds);
  const end = BigInt(endMicroseconds);
  if (start > end) {
    throw new Error("End time cannot be later than start time.");
  }
  const periodsCrossed = PERIODS.reduce(
    (acc, period) => {
      // Get each period boundary of the start time; i.e., round it down to the nearest boundary.
      const lowerPeriodBoundary = getPeriodBoundary(start, period);
      // Add the time delta for one period boundary to the start time's lower period boundary to get
      // the upper (next) period boundary.
      const periodDuration = BigInt(periodEnumToRawDuration(period));
      const upperPeriodBoundary = lowerPeriodBoundary + periodDuration;
      // If the end time is greater than or equal to the start time's upper period boundary, that
      // period boundary has been crossed.
      if (end >= upperPeriodBoundary) {
        acc.add(period);
      }
      return acc;
    },
    new Set([]) as Set<Period>
  );
  return periodsCrossed.size;
};
