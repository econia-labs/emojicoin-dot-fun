// cspell:word upstash
import { Lock } from "@upstash/lock";
import type { Redis } from "@upstash/redis";

const DEFAULT_LEASE_TIME = 5000;

export function createLock(redis: Redis, cacheKey: string) {
  return new Lock({
    id: cacheKey,
    lease: DEFAULT_LEASE_TIME,
    redis,
    retry: {
      attempts: 1,
      delay: 0,
    },
  });
}
