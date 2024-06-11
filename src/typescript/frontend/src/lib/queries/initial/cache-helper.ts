"use server";

import { UnitOfTime, getTime } from "@sdk/utils/misc";
import { cache } from "react";

/**
 * A helper function to either cache data or fetch it from a static source, because the production
 * endpoint is not set up yet.
 */
export const fetchInitialWithFallback = async <T1, T2>({
  functionArgs,
  queryFunction,
}: {
  functionArgs: T2;
  queryFunction: (args: T2) => Promise<T1>;
}) => {
  const currentMinute = Math.floor(getTime(UnitOfTime.Minutes));
  const cachedFunction = cache(
    async (args: { time: number; functionArgs: T2 }) => await queryFunction(args.functionArgs)
  );
  return await cachedFunction({
    time: currentMinute,
    functionArgs,
  });
};

export default fetchInitialWithFallback;
