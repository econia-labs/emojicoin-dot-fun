// Postgres doesn't deterministically sort when columns are equal. In order to compare the
// results when values are equal, we must partition all results into groups based on their
// values, and compare the differences in the sets of results, and then compare the earliest
// "appearance" of any value in each `value: (...marketID)` set against the one in the
// unsorted results set.
//
// That is, say we have { 1n: 100, 2n: 200, 3n: 200 } in the table, where `1n` is a marketID
// and `100` is the query'es relevant value (the second field in the `mapFunction`).
// In our first sorted query results (the one passed in), the resulting mapped array might be:
// [ [marketID, value, index], ... ]
// [ [1n, 100, 1], [2n, 200, 2], [3n, 300, 3] ]
// OR
// [ [1n, 100, 1], [3n, 200, 2], [2n, 200, 3] ]
// Note that the market ID 3n appears before 2n, since they have the same result.
//
// Thus in order to compare the query results with subsets of unsorted market IDs (the ones
// with equal `value` fields), we will bin each result according to its `value` field, then
// get the lowest index in the bin. Then we compare that to the manually sorted result.
// In the case above, this would be:
// { 100: [ Set(1n), 1], 200: [ Set(2n, 3n), 2] }
// Then when comparing each query's results in this structure, we can know what (if any)

import { sortBigIntArrays } from "../../../../src";

// differences there are in the marketIDs, values and sort order.
type SortableResults = {
  marketID: bigint;
  value: bigint;
  index: number;
};
export const sortWithUnsortedSubsets = (
  values: SortableResults[]
): Map<bigint, [Set<bigint>, number]> => {
  // The mapping of { value: [Set(marketIDs), lowestIndex] };
  const valueMap = new Map<bigint, [Set<bigint>, number]>();
  for (const { marketID, value, index } of values) {
    if (!valueMap.has(value)) {
      valueMap.set(value, [new Set(), Infinity]);
    }
    const [marketIDs, currLowestIndex] = valueMap.get(value)!;
    marketIDs.add(marketID);
    const newLowestIndex = Math.min(index, currLowestIndex);
    valueMap.set(value, [marketIDs, newLowestIndex]);
  }

  return valueMap;
};

export const checkSubsetsEqual = (results: SortableResults[], expected: SortableResults[]) => {
  expect(results.length).toEqual(expected.length);
  const binnedResults = sortWithUnsortedSubsets(results);
  const binnedExpected = sortWithUnsortedSubsets(expected);
  expect(binnedResults.size).toEqual(binnedExpected.size);
  const sortedResultKeys = Array.from(binnedResults.keys()).toSorted();
  const sortedExpectedKeys = Array.from(binnedExpected.keys()).toSorted();
  expect(sortedResultKeys).toEqual(sortedExpectedKeys);

  for (const key of binnedResults.keys()) {
    const [expectedBin, resultBin] = [binnedExpected.get(key)!, binnedResults.get(key)!];
    expect(expectedBin).toBeDefined();
    expect(resultBin).toBeDefined();
    const [marketIDsExpected, lowestIndexExpected] = expectedBin;
    const [marketIDsResult, lowestIndexResult] = resultBin;
    expect(marketIDsExpected).toEqual(marketIDsResult);
    expect(lowestIndexExpected).toEqual(lowestIndexResult);
  }
};

export const toSortableResults = (pair: [bigint, bigint], index: number) => {
  const [marketID, value] = pair;
  return {
    marketID,
    value,
    index,
  };
};

// Sorts pairs by v[1], v[0] instead of v[0], v[1], particularly for arrays of [marketID, value]
// for the contrived/expected tests.
export const sortBigIntPairsReversed = (arr: Array<[bigint, bigint]>): Array<[bigint, bigint]> =>
  arr
    .map(([a, b]) => [b, a] as [bigint, bigint])
    .toSorted(sortBigIntArrays)
    .map(([a, b]) => [b, a] as [bigint, bigint]);
