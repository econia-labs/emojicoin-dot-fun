// cspell:word dexscreener
/***
 Request: GET /pair?id=:string

 Response Schema:
 // interface PairResponse {
 //  pair: Pair;
 // }

 Example Response:
 // {
 //   "pair": {
 //     "id": "0x11b815efB8f581194ae79006d24E0d814B7697F6",
 //     "dexKey": "uniswap",
 //     "asset0Id": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
 //     "asset1Id": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
 //     "createdAtBlockNumber": 100,
 //     "createdAtBlockTimestamp": 1698126147,
 //     "createdAtTxnId": "0xe9e91f1ee4b56c0df2e9f06c2b8c27c6076195a88a7b8537ba8313d80e6f124e",
 //     "feeBps": 100
 //   }
 // }
 **/

import { type NextRequest, NextResponse } from "next/server";
import { fetchMarketRegistrationEventBySymbolEmojis } from "@sdk/indexer-v2/queries/app/dexscreener";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { INTEGRATOR_FEE_RATE_BPS } from "@sdk/const";
import { pairIdToSymbolEmojis, symbolEmojisToString } from "../util";

/**
 * - All `Pair` props are immutable - Indexer will not query a given pair more than once
 * - In most cases, pair ids will correspond to contract addresses. Ids are case-sensitive.
 * - `dexKey` is an identifier for the DEX that hosts this pair. For most adapters this will be a static value such as
 * `uniswap`, but if multiple DEXes are tracked an id such as a factory address may be used.
 * - `asset0` and `asset1` order should **never** change. `amount0/reserve0` will always refer to the same `asset0`,
 * and `amount1/reserve1` will always refer to the same `asset1`. If asset order mutates then all data after the change
 * will be invalid and a re-index will be required.
 *     - A simple strategy to keep this in check is to simply order assets alphabetically. For example, in a pair
 * containing assets `0xAAA` and `0xZZZ`, `asset0=0xAAA` and `asset1=0xZZZ`
 *     - DEX Screener UI will automatically invert pairs as needed and default to their most logical order (i.e.:
 * `BTC/USD` as opposed to `USD/BTC`)
 * - `createdAtBlockNumber`, `createdAtBlockTimestamp` and `createdAtTxnId` are optional but encouraged. If unavailable
 * DEX Screener can bet set to assume pair creation date is the same date as its first ever event.
 * - `feeBps` corresponds to swap fees in bps. For instance, a fee of 1% maps to `feeBps=100`
 * - `pool` is only recommended for DEXes that support multi-asset pools and allows the DEX Screener UI to correlate
 * multiple pairs in the same multi-asset pool
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 */
interface Pair {
  id: string;
  dexKey: string;
  asset0Id: string;
  asset1Id: string;
  createdAtBlockNumber?: number;
  createdAtBlockTimestamp?: number; // Whole number representing a UNIX timestamp in seconds.
  createdAtTxnId?: string;
  creator?: string;
  feeBps?: number;
  pool?: {
    id: string;
    name: string;
    assetIds: string[];
    pairIds: string[];
    metadata?: Record<string, string>;
  };
  metadata?: Record<string, string>;
}

interface PairResponse {
  pair: Pair;
}

/**
 *
 * @param pairId is the pair ID. Generally it's `event.market.symbolEmojis.join("") + "-APT"`
 */
async function getPair(
  pairId: string
): Promise<{ pair: Pair; error?: never } | { pair?: never; error: NextResponse<PairResponse> }> {
  const symbolEmojis = pairIdToSymbolEmojis(pairId);

  const marketRegistrations = await fetchMarketRegistrationEventBySymbolEmojis({
    searchEmojis: symbolEmojis,
  });
  const marketRegistration = marketRegistrations.pop();
  if (!marketRegistration) {
    return {
      error: new NextResponse(`Market registration not found for pairId: ${pairId}`, {
        status: 404,
      }),
    };
  }

  const aptos = getAptosClient();
  const block = await aptos.getBlockByVersion({
    ledgerVersion: marketRegistration.transaction.version,
  });

  return {
    pair: {
      id: pairId,
      dexKey: "emojicoin.fun",
      asset0Id: symbolEmojisToString(symbolEmojis),
      asset1Id: "APT",
      createdAtBlockNumber: parseInt(block.block_height),
      createdAtBlockTimestamp: Math.floor(
        marketRegistration.transaction.timestamp.getTime() / 1000
      ),
      createdAtTxnId: String(marketRegistration.transaction.version),
      feeBps: INTEGRATOR_FEE_RATE_BPS,
    },
  };
}

// Although this route would be ideal for caching, nextjs doesn't offer the ability to control
// caches for failed responses. In other words, if someone queries an asset that doesn't exist
// yet at this endpoint, it would permanently cache that asset as not existing and thus return
// the failed query JSON response. This is obviously problematic for not yet existing markets,
// so unless we have some way to not cache failed queries/empty responses, we can't cache this
// endpoint at all.
export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest): Promise<NextResponse<PairResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const pairId = searchParams.get("id");
  if (!pairId) {
    return new NextResponse("id is a required parameter", { status: 400 });
  }
  const { pair, error } = await getPair(pairId);
  if (error) return error;

  return NextResponse.json({ pair });
}
