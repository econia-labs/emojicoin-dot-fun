/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnitOfTime, getTime } from "@/sdk/utils/misc";
import { cache } from "react";
import { INITIAL_REVALIDATION_TIMES } from "./const";
import { SHORT_REVALIDATE } from "lib/env";

/**
 *
 * A helper function to either cache data or fetch it from a static source, because the production
 * endpoint is not set up yet.
 *
 */
export const fetchInitialWithFallback = async <T, T2>({
  functionArgs,
  queryFunction,
  endpoint,
}: {
  functionArgs: T2;
  queryFunction: (args: T2) => Promise<T>;
  endpoint: string | URL;
}) => {
  const vercel = process.env.VERCEL === "1";
  const local = process.env.INBOX_URL === "http://localhost:3000";

  // For the inner cache, since it may be used elsewhere independently.
  const revalidate = INITIAL_REVALIDATION_TIMES[SHORT_REVALIDATE ? "short" : "long"];

  let fn: (args: T2) => Promise<T>;

  if (vercel && local) {
    console.warn("Warning: This vercel build is using `localhost:3000` as the inbox endpoint.");
    console.warn("Using sample market data.");

    fn = async () => (await fetch(endpoint, { next: { revalidate } })) as T;
    console.log('-'.repeat(100));
    console.log(functionArgs);
    console.log(fn(functionArgs));
  } else {
    fn = queryFunction;
  }

  const currentHour = Math.floor(getTime(UnitOfTime.Hours));
  const cachedFunction = cache(
    async (args: { vercel: boolean; local: boolean; time: number; functionArgs: T2 }) => await fn(args.functionArgs),
  );
  return await cachedFunction({
    vercel: vercel,
    local: local,
    time: currentHour,
    functionArgs,
  });
};

export default fetchInitialWithFallback;
