/* eslint-disable @typescript-eslint/no-explicit-any */
import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage-instance";
import type { IncrementalCache } from "next/dist/server/lib/incremental-cache";

export const getIncrementalCache = () => {
  const store = staticGenerationAsyncStorage.getStore();
  const maybeIncrementalCache: IncrementalCache | undefined =
    store?.incrementalCache || (globalThis as any).__incrementalCache;
  return maybeIncrementalCache;
};

export const getCacheHandler = () => {
  const cacheHandler = getIncrementalCache()?.cacheHandler;
  if (!cacheHandler) return undefined;
  return cacheHandler;
};
