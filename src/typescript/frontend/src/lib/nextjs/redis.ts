import { Lock } from "@upstash/lock";
import { Redis } from "@upstash/redis";
import { KV_REST_API_TOKEN, KV_REST_API_URL } from "lib/server-env";
import { createClient } from "redis";

import { sleep } from "@/sdk/index";

let _client: ReturnType<typeof createClient> | undefined;
const getRedisClient = async () => {
  try {
    if (!process.env.USE_LOCAL_REDIS_CLIENT) return undefined;
    if (!_client) _client = createClient(); // Defaults to localhost:6379

    let i = 0;
    while (i < 10) {
      if (!_client.isOpen) await _client.connect();
      if (_client.isReady) break;
      await sleep(1000);
      i += 1;
    }
    return _client;
  } catch (_e) {
    return undefined;
  }
};

type LogArgs = {
  cacheKey: string;
  entry: string;
  uuid?: string;
};

const p_uuid = Math.random().toString(16).slice(2, 8);

export async function cacheLog({ cacheKey, entry, uuid }: LogArgs) {
  if (!process.env.UNSTABLE_CACHE_WRAPPER_DEBUG) return;
  const client = await getRedisClient();
  const newUuid = (uuid?.split("-").at(1) || p_uuid).slice(0, 6);
  const date = new Date().toISOString().split("T").at(1)?.slice(0, -1);
  const fullEntry = `uuid: ${newUuid} [${date}] ${entry}`;
  if (client) {
    await client.rPush(cacheKey, fullEntry);
  } else {
    console.debug(`{${cacheKey}}: ${fullEntry}`);
  }
}

// Give access to the cache log for *.js files used in `next.config.mjs`.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(globalThis as any).__cacheLog = cacheLog;

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
