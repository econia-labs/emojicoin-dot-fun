/***
 Request: GET /events?fromBlock=:number&toBlock=:number

 - fromBlock and toBlock are both inclusive: a request to /events?fromBlock=10&toBlock=15 should include all
 available events from block 10, 11, 12, 13, 14 and 15

 Response Schema:
 // interface EventsResponse {
 //  events: Array<{ block: Block } & (SwapEvent | JoinExitEvent)>;
 // }

 Example Response:
 // {
 //   "events": [
 //     {
 //       "block": {
 //         "blockNumber": 10,
 //         "blockTimestamp": 1673319600
 //       },
 //       "eventType": "swap",
 //       "txnId": "0xe9e91f1ee4b56c0df2e9f06c2b8c27c6076195a88a7b8537ba8313d80e6f124e",
 //       "txnIndex": 4,
 //       "eventIndex": 3,
 //       "maker": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 //       "pairId": "0x123",
 //       "asset0In": 10000,
 //       "asset1Out": 20000,
 //       "priceNative": 2,
 //       "reserves": {
 //         "asset0": 500,
 //         "asset1": 1000
 //       }
 //     },
 //     {
 //       "block": {
 //         "blockNumber": 10,
 //         "blockTimestamp": 1673319600
 //       },
 //       "eventType": "join",
 //       "txnId": "0xea1093d492a1dcb1bef708f771a99a96ff05dcab81ca76c31940300177fcf49f",
 //       "txnIndex": 0,
 //       "eventIndex": 0,
 //       "maker": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 //       "pairId": "0x456",
 //       "amount0": 10,
 //       "amount1": 5,
 //       "reserves": {
 //         "asset0": 100,
 //         "asset1": 50
 //       }
 //     },
 //     {
 //       "block": {
 //         "blockNumber": 11,
 //         "blockTimestamp": 1673406000
 //       },
 //       "eventType": "swap",
 //       "txnId": "0xea1093d492a1dcb1bef708f771a99a96ff05dcab81ca76c31940300177fcf49f",
 //       "txnIndex": 1,
 //       "eventIndex": 20,
 //       "maker": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 //       "pairId": "0x456",
 //       "asset0In": 0.0123456789,
 //       "asset1Out": 0.000123456789,
 //       "priceNative": 0.00000012345,
 //       "reserves": {
 //         "asset0": 0.0001,
 //         "asset1": 0.000000000000001
 //       }
 //     }
 //   ]
 // }
 **/

import { type NextRequest, NextResponse } from "next/server";
import { type Block } from "./latest-block";


/**
 * - `txnId` is a transaction identifier such as a transaction hash
 * - `txnIndex` refers to the order of a transaction within a block, the higher the index the later in the block the
 * transaction was processed
 * - `eventIndex` refer to the order of the event within a transaction, the higher the index the later in the
 * transaction the event was processed
 * - The combination of `txnIndex` + `eventIndex` must be unique to any given event within a block, including for
 * different event types
 * - `maker` is an identifier for the account responsible for submitting the transaction. In most cases the transaction
 * is submitted by the same account that sent/received tokens, but in cases where this doesn't apply (i.e.: transaction
 * submitted by an aggregator) an effort should be made to identify the underlying account
 * - All amounts (`assetIn`/`assetOut`/`reserve`) should be decimalized (`amount / (10 ** assetDecimals)`)
 * - Reserves refer to the pooled amount of each asset *after* a swap event has occured. If there are multiple swap
 * events on the same block and reserves cannot be determined after each individual event then it's acceptable for only
 * the last event to contain the `reserves` prop
 *     - While `reserves` are technically optional, the Indexer relies on it for accurately calculating derived USD
 * pricing (i.e.: USD price for `FOO/BAR` derived from `BAR/USDC`) from the most suitable reference pair. Pairs with no
 * known reserves, from both `SwapEvent` or `JoinExitEvent`, will **not** be used for derived pricing and this may
 * result in pairs with no known USD prices
 *     - `reserves` are also required to calculate total liquidity for each pair: if that's not available then DEX
 * Screener will show liquidity as `N/A` and a warning for “Unknown liquidity”
 * - A combination of either `asset0In + asset1Out` or `asset1In + asset0Out` is expected. If there are multiple assets
 * in or multiple assets out then the swap event is considered invalid and indexing will halt
 * - `priceNative` refers to the price of `asset0` quoted in `asset1` in that event
 *     - For example, in a theoretical `BTC/USD` pair, `priceNative` would be `30000` (1 BTC = 30000 USD)
 *
 *     - Similarly, in a theoretical `USD/BTC` pair, `priceNative` would be `0.00003333333333` (1 USD =
 * 0.00003333333333 USD)
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 * - The Indexer will use up to 50 decimal places for amounts/prices/reserves and all subsequent decimal places will be
 * ignored. Using all 50 decimal places is highly encouraged to ensure accurate prices
 * - The Indexer automatically handles calculations for USD pricing (`priceUsd` as opposed to `priceNative`)
 */
export interface SwapEvent {
  eventType: "swap";
  txnId: string;
  txnIndex: number;
  eventIndex: number;
  maker: string;
  pairId: string;
  asset0In?: number | string;
  asset1In?: number | string;
  asset0Out?: number | string;
  asset1Out?: number | string;
  priceNative: number | string;
  reserves?: {
    asset0: number | string;
    asset1: number | string;
  };
  metadata?: Record<string, string>;
}

/**
 * - `txnId` is a transaction identifier such as a transaction hash
 * - `txnIndex` refers to the order of a transaction within a block, the higher the index the later in the block the
 * transaction was processed
 * - `eventIndex` refer to the order of the event within a transaction, the higher the index the later in the
 * transaction the event was processed
 * - The combination of `txnIndex` + `eventIndex` must be unique to any given event within a block, including for
 * different event types
 * - `maker` is an identifier for the account responsible for submitting the transaction. In most cases the transaction
 * is submitted by the same account that sent/received tokens, but in cases where this doesn't apply (i.e.: transaction
 * submitted by an aggregator) an effort should be made to identify the underlying account.
 * - All amounts (`assetIn`/`assetOut`/`reserve`) should be decimalized (`amount / (10 ** assetDecimals)`)
 * - Reserves refer to the pooled amount of each asset *after* a join/exit event has occured. If there are multiple
 * join/exit events on the same block and reserves cannot be determined after each individual event then it's
 * acceptable for only the last event to contain the `reserves` prop.
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not required in most cases
 */
export interface JoinExitEvent {
  eventType: "join" | "exit";
  txnId: string;
  txnIndex: number;
  eventIndex: number;
  maker: string;
  pairId: string;
  amount0: number | string;
  amount1: number | string;
  reserves?: {
    asset0: number | string;
    asset1: number | string;
  };
  metadata?: Record<string, string>;
}

export type Event = (SwapEvent | JoinExitEvent) & { block: Block };

export interface EventsResponse {
  events: Event[];
}

// NextJS JSON response handler
export async function GET(request: NextRequest): Promise<NextResponse<EventsResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const fromBlock = searchParams.get("fromBlock");
  const toBlock = searchParams.get("toBlock");
  const events = await getEvents(fromBlock, toBlock);
  return NextResponse.json({ events });
}