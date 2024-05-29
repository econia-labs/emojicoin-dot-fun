/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnitOfTime, getTime } from "@sdk/utils/misc";
import { cache } from "react";
import { INITIAL_REVALIDATION_TIMES } from "./const";
import { SHORT_REVALIDATE } from "lib/env";

/**
 *
 * A helper function to either cache data or fetch it from a static source, because the production
 * endpoint is not set up yet.
 *
 */
export const fetchInitialWithFallback = async <T1, T2>({
  functionArgs,
  queryFunction,
  endpoint,
}: {
  functionArgs: T2;
  queryFunction: (args: T2) => Promise<T1>;
  endpoint: string | URL;
}) => {
  const vercel = process.env.VERCEL === "1";
  const local = process.env.INBOX_URL === "http://localhost:3000";

  // For the inner cache, since it may be used elsewhere independently.
  const revalidate = INITIAL_REVALIDATION_TIMES[SHORT_REVALIDATE ? "short" : "long"];

  let fn: (args: T2) => Promise<T1>;

  if ((vercel && local) || process.env.NEXT_PUBLIC_FORCE_STATIC_FETCH === "true") {
    fn = async (_args: T2) =>
      fetch(endpoint, { next: { revalidate } }).then((r) => r.json().then((j) => j as T1));
  } else {
    fn = queryFunction;
  }

  const currentHour = Math.floor(getTime(UnitOfTime.Hours));
  const cachedFunction = cache(
    async (args: { vercel: boolean; local: boolean; time: number; functionArgs: T2 }) =>
      await fn(args.functionArgs)
  );
  return await cachedFunction({
    vercel: vercel,
    local: local,
    time: currentHour,
    functionArgs,
  });
};

export default fetchInitialWithFallback;
