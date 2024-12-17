// cspell:word dexscreener
/***
 - The `/latest-block` endpoint should be in sync with the `/events` endpoint, meaning it should only return the latest block where data from `/events` will be available. This doesn't mean it should return the latest block with an event, but it should not return a block for which `/events` has no data available yet.
 - If `/events` fetches data on-demand this isn't an issue, but if it relies on data indexed and persisted in the backend then `/latest-block` should be aware of the latest persisted block
 - During live indexing, the Indexer will continuously poll `/latest-block` and use its data to then query `/events`
 Response Schema:
 // interface LatestBlockResponse {
 //   block: Block;
 // }
 Example Response:
 // {
 //   "block": {
 //     "blockNumber": 100,
 //     "blockTimestamp": 1698126147
 //   }
 // }
 **/

import { type NextRequest, NextResponse } from "next/server";
import { getProcessorStatus } from "@sdk/indexer-v2/queries";
import { getAptosClient } from "@sdk/utils/aptos-client";

/**
 * - `blockTimestamp` should be a UNIX timestamp, **not** including milliseconds
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 */
export interface Block {
  blockNumber: number;
  blockTimestamp: number;
  metadata?: Record<string, string>;
}

interface LatestBlockResponse {
  block: Block;
}

// NextJS JSON response handler
export async function GET(_request: NextRequest): Promise<NextResponse<LatestBlockResponse>> {
  const status = await getProcessorStatus();
  const aptos = getAptosClient();
  const latestBlock = await aptos.getBlockByVersion({ ledgerVersion: status.lastSuccessVersion });
  // Because we may not have finished processing the entire block yet, we return block number - 1
  // here. This adds ~1s (block time) of latency, but ensures completeness. We set it to 0 if below.
  const blockHeight = parseInt(latestBlock.block_height, 10);
  const blockNumber = blockHeight > 0 ? blockHeight - 1 : 0;

  return NextResponse.json({
    block: {
      blockNumber,
      // Convert to seconds
      blockTimestamp: status.lastTransactionTimestamp.getTime() / 1000,
    },
  });
}
