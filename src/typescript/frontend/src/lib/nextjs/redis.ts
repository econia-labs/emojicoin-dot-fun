import { Lock } from "@upstash/lock";
import { Redis } from "@upstash/redis";
import { KV_REST_API_TOKEN, KV_REST_API_URL } from "lib/server-env";
import { createClient } from "redis";

import { sleep } from "@/sdk/index";

let _client: ReturnType<typeof createClient> | undefined;
const _getRedisClient = async () => {
  try {
    if (!process.env.USE_LOCAL_REDIS_CLIENT) return undefined;
    if (!_client) _client = createClient(); // Defaults to localhost:6379
    for (let i = 0; i < 3; i += 1) {
      if (!_client.isOpen) await _client.connect();
      if (_client.isReady) break;
      await sleep(100);
    }
    return _client;
  } catch (_e) {
    return undefined;
  }
};

const upstashRedis = new Redis({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
});

const DEFAULT_LEASE_TIME = 5000;

export function createLock(cacheKey: string) {
  return new Lock({
    id: cacheKey,
    lease: DEFAULT_LEASE_TIME,
    redis: upstashRedis,
    retry: {
      attempts: 1,
      delay: 0,
    },
  });
}
