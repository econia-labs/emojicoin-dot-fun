/* eslint-disable @typescript-eslint/no-explicit-any */
import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage-instance";
import type { CacheHandler, IncrementalCache } from "next/dist/server/lib/incremental-cache";

import { PatchedFetchCache, PatchedFileSystemCache } from "./cache-handlers";

export const getIncrementalCache = () => {
  const store = staticGenerationAsyncStorage.getStore();
  const maybeIncrementalCache: IncrementalCache | undefined =
    store?.incrementalCache || (globalThis as any).__incrementalCache;
  return maybeIncrementalCache;
};

export const isPatchedFetchCache = (c: CacheHandler): c is PatchedFetchCache =>
  c instanceof PatchedFetchCache || c["kind"] === PatchedFetchCache.kind;

export const isPatchedFileSystemCache = (c: CacheHandler): c is PatchedFileSystemCache =>
  c instanceof PatchedFileSystemCache || c["kind"] === PatchedFileSystemCache.kind;

export const isPatchedCacheHandler = (c: CacheHandler) =>
  isPatchedFetchCache(c) || isPatchedFileSystemCache(c);

export const getCacheHandler = () => {
  const cacheHandler = getIncrementalCache()?.cacheHandler;
  if (!cacheHandler) return undefined;
  return cacheHandler;
};
