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

/**
 * - `blockTimestamp` should be a UNIX timestamp, **not** including milliseconds
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 */
export interface Block {
  blockNumber: number;
  blockTimestamp: number;
  metadata?: Record<string, string>;
}

export interface LatestBlockResponse {
  block: Block;
}

// NextJS JSON response handler
export async function GET(_request: NextRequest): Promise<NextResponse<LatestBlockResponse>> {
  const status = await getProcessorStatus();
  return NextResponse.json({
    block: {
      // TODO: do we want to use the block here?
      blockNumber: Number(status.lastSuccessVersion),
      // Convert to seconds
      blockTimestamp: status.lastTransactionTimestamp.getTime() / 1000,
    }
  });
}