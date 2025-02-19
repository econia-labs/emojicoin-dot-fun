if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { compareNumber } from "../../../utils";

/* eslint-disable import/no-unused-modules */
/**
 * Given an exhaustive list of price deltas for all markets, sort them based on query params.
 */
export const manuallyPaginatePriceDeltas = ({
  priceDeltas,
  page,
  pageSize,
  desc,
}: {
  priceDeltas: { [symbol: string]: number };
  page: number;
  pageSize: number;
  desc: boolean;
}): [string, number][] => {
  const [start, end] = [(page - 1) * pageSize, page * pageSize];
  const entries = Object.entries(priceDeltas);
  const sortedAsc = entries.sort(([_, d1], [__, d2]) => compareNumber(d1, d2));
  const sorted = desc ? sortedAsc.toReversed() : sortedAsc;
  return sorted.slice(start, end);
};
/* eslint-enable import/no-unused-modules */
