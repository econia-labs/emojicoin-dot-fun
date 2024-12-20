// cspell:word dexscreener
/***
 Request: GET /events?fromBlock=:number&toBlock=:number

 - fromBlock and toBlock are both inclusive: a request to /events?fromBlock=10&toBlock=15 should
 include all available events from block 10, 11, 12, 13, 14 and 15.

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
import { type Block } from "../latest-block/route";
import {
  fetchLiquidityEventsByBlock,
  fetchSwapEventsByBlock,
} from "@sdk/indexer-v2/queries/app/dexscreener";
import {
  isLiquidityEventModel,
  type toLiquidityEventModel,
  type toSwapEventModel,
} from "@sdk/indexer-v2/types";
import { calculateCurvePrice, getReserves } from "@sdk/markets";
import { toCoinDecimalString } from "../../../lib/utils/decimals";
import { DECIMALS } from "@sdk/const";
import { symbolEmojisToPairId } from "../util";
import { compareBigInt, type Flatten } from "@econia-labs/emojicoin-sdk";
import { type XOR } from "@sdk/utils/utility-types";

export type Asset0In1Out = {
  asset0In: number | string;
  asset1Out: number | string;
};

export type Asset1In0Out = {
  asset0Out: number | string;
  asset1In: number | string;
};

export type AssetInOut = XOR<Asset0In1Out, Asset1In0Out>;

export type DexscreenerReserves = {
  reserves: {
    asset0: number | string;
    asset1: number | string;
  };
};

/**
 * - `txnId` is a transaction identifier such as a transaction hash
 * - `txnIndex` refers to the order of a transaction within a block, the higher the index the later
 * in the block the transaction was processed
 * - `eventIndex` refer to the order of the event within a transaction, the higher the index the
 * later in the transaction the event was processed
 * - The combination of `txnIndex` + `eventIndex` must be unique to any given event within a block,
 * including for different event types
 * - `maker` is an identifier for the account responsible for submitting the transaction. In most
 * cases the transaction is submitted by the same account that sent/received tokens, but in cases
 * where this doesn't apply (i.e.: transaction submitted by an aggregator) an effort should be made
 * to identify the underlying account
 * - All amounts (`assetIn`/`assetOut`/`reserve`) should be decimalized
 * (`amount / (10 ** assetDecimals)`)
 * - Reserves refer to the pooled amount of each asset *after* a swap event has occurred. If there
 * are multiple swap events on the same block and reserves cannot be determined after each
 * individual event then it's acceptable for only the last event to contain the `reserves` prop
 * - While `reserves` are technically optional, the Indexer relies on it for accurately calculating
 * derived USD pricing (i.e. USD price for `FOO/BAR` derived from `BAR/USDC`) from the most suitable
 * reference pair. Pairs with no known reserves, from both `SwapEvent` or `JoinExitEvent`, will
 * **not** be used for derived pricing and this may result in pairs with no known USD prices
 * - `reserves` are also required to calculate total liquidity for each pair: if that's not
 * available then DEX Screener will show liquidity as `N/A` and a warning for “Unknown liquidity”
 * - A combination of either `asset0In + asset1Out` or `asset1In + asset0Out` is expected. If there
 * are multiple assets in or multiple assets out then the swap event is considered invalid and
 * indexing will halt
 * - `priceNative` refers to the price of `asset0` quoted in `asset1` in that event
 *    - For example, in a theoretical `BTC/USD` pair, if 1 BTC = 30000 USD `priceNative` == `30000`
 *    - Similarly, in a theoretical `USD/BTC` pair, `priceNative` would be `0.00003333333333`
 *      (1 BTC = 0.00003333333333 USD)
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not
 * required in most cases
 * - The Indexer will use up to 50 decimal places for amounts/prices/reserves and all subsequent
 * decimal places will be ignored. Using all 50 decimal places is highly encouraged to ensure
 * accurate prices
 * - The Indexer automatically handles calculations for USD pricing (`priceUsd` as opposed to
 * `priceNative`)
 */
export type SwapEvent = Flatten<
  {
    eventType: "swap";
    txnId: string;
    txnIndex: number;
    eventIndex: number;
    maker: string;
    pairId: string;
    priceNative: number | string;
    metadata?: Record<string, string>;
  } & AssetInOut &
    DexscreenerReserves
>;

/**
 * - `txnId` is a transaction identifier such as a transaction hash
 * - `txnIndex` refers to the order of a transaction within a block, the higher the index the later
 * in the block the transaction was processed
 * - `eventIndex` refer to the order of the event within a transaction, the higher the index the
 * later in the transaction the event was processed
 * - The combination of `txnIndex` + `eventIndex` must be unique to any given event within a block,
 * including for different event types
 * - `maker` is an identifier for the account responsible for submitting the transaction. In most
 * cases the transaction is submitted by the same account that sent/received tokens, but in cases
 * where this doesn't apply (i.e.: transaction submitted by an aggregator) an effort should be made
 * to identify the underlying account.
 * - All amounts (`assetIn`/`assetOut`/`reserve`) should be decimalized:
 *   (`amount / (10 ** assetDecimals)`)
 * - Reserves refer to the pooled amount of each asset *after* a join/exit event has occurred.
 * If there are multiple join/exit events on the same block and reserves cannot be determined after
 * each individual event then it's acceptable for only the last event to contain the `reserves` prop
 * - `metadata` includes any optional auxiliary info not covered in the default schema and not
 * required in most cases
 */
type JoinExitEvent = Flatten<
  {
    eventType: "join" | "exit";
    txnId: string;
    txnIndex: number;
    eventIndex: number;
    maker: string;
    pairId: string;
    amount0: number | string;
    amount1: number | string;
    metadata?: Record<string, string>;
  } & DexscreenerReserves
>;

type BlockInfo = { block: Block };
type Event = (SwapEvent | JoinExitEvent) & BlockInfo;

interface EventsResponse {
  events: Event[];
}
function toDexscreenerSwapEvent(event: ReturnType<typeof toSwapEventModel>): SwapEvent & BlockInfo {
  // Base / quote is emojicoin / APT.
  // Thus asset0 / asset1 is always base volume / quote volume.
  const assetInOut = event.swap.isSell
    ? {
        asset0In: toCoinDecimalString(event.swap.baseVolume, DECIMALS),
        asset1Out: toCoinDecimalString(event.swap.quoteVolume, DECIMALS),
      }
    : {
        asset0Out: toCoinDecimalString(event.swap.baseVolume, DECIMALS),
        asset1In: toCoinDecimalString(event.swap.quoteVolume, DECIMALS),
      };

  const { base, quote } = getReserves(event.state);
  const reserves = {
    asset0: toCoinDecimalString(base, DECIMALS),
    asset1: toCoinDecimalString(quote, DECIMALS),
  };

  const priceNative = calculateCurvePrice(event.state).toFixed(50).toString();

  if (!event.blockAndEvent) throw new Error("blockAndEvent is undefined");

  return {
    block: {
      blockNumber: Number(event.blockAndEvent.blockNumber),
      blockTimestamp: Math.floor(event.transaction.timestamp.getTime() / 1000),
    },
    eventType: "swap",
    txnId: event.transaction.version.toString(),

    txnIndex: Number(event.transaction.version),
    eventIndex: Number(event.blockAndEvent.eventIndex),

    maker: event.transaction.sender,
    pairId: symbolEmojisToPairId(event.market.symbolEmojis),

    ...assetInOut,
    priceNative,
    reserves,
  };
}

function toDexscreenerJoinExitEvent(
  event: ReturnType<typeof toLiquidityEventModel>
): JoinExitEvent & BlockInfo {
  const { base, quote } = getReserves(event.state);
  const reserves = {
    asset0: toCoinDecimalString(base, DECIMALS),
    asset1: toCoinDecimalString(quote, DECIMALS),
  };

  if (!event.blockAndEvent) throw new Error("blockAndEvent is undefined");

  return {
    block: {
      blockNumber: Number(event.blockAndEvent.blockNumber),
      blockTimestamp: Math.floor(event.transaction.timestamp.getTime() / 1000),
    },
    eventType: event.liquidity.liquidityProvided ? "join" : "exit",

    txnId: event.transaction.version.toString(),

    txnIndex: Number(event.transaction.version),
    eventIndex: Number(event.blockAndEvent.eventIndex),

    maker: event.transaction.sender,
    pairId: symbolEmojisToPairId(event.market.symbolEmojis),

    amount0: toCoinDecimalString(event.liquidity.baseAmount, DECIMALS),
    amount1: toCoinDecimalString(event.liquidity.quoteAmount, DECIMALS),
    reserves,
  };
}

async function getEventsByVersion(fromBlock: number, toBlock: number): Promise<Event[]> {
  const swapEvents = await fetchSwapEventsByBlock({ fromBlock, toBlock });
  const liquidityEvents = await fetchLiquidityEventsByBlock({ fromBlock, toBlock });

  // Merge these two arrays by their `transaction.version`
  return [...swapEvents, ...liquidityEvents]
    .sort((a, b) => compareBigInt(a.transaction.version, b.transaction.version))
    .map((event) =>
      isLiquidityEventModel(event)
        ? toDexscreenerJoinExitEvent(event)
        : toDexscreenerSwapEvent(event)
    );
}

// Don't cache this request, because we could inadvertently cache data that is immediately invalid
// in the case where the `toBlock` is larger than the present block. Although this shouldn't happen,
// it's not worth caching these queries anyway, because they should only be called once or twice
// with the same query parameters.
export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * We treat our versions as "blocks" because it's faster to implement given our current architecture
 * This requires dexscreener to have relatively large `fromBlock - toBlock` ranges to keep up
 * */
export async function GET(request: NextRequest): Promise<NextResponse<EventsResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const fromBlock = searchParams.get("fromBlock");
  const toBlock = searchParams.get("toBlock");
  if (fromBlock === null || toBlock === null) {
    // This should never happen, and is an invalid call
    return new NextResponse("fromBlock and toBlock are required parameters", { status: 400 });
  }

  const events = await getEventsByVersion(parseInt(fromBlock, 10), parseInt(toBlock, 10));

  return NextResponse.json({ events });
}
