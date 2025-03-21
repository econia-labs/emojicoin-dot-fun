import { type NextRequest, NextResponse } from "next/server";
import { DECIMALS, EMOJICOIN_SUPPLY, INTEGRATOR_FEE_RATE_BPS } from "@sdk/const";
import {
  calculateCirculatingSupply,
  calculateCurvePrice,
  calculateRealReserves,
} from "@sdk/markets";
import { fetchMarketState } from "@/queries/market";
import { compareBigInt, getAptosClient, toNominal } from "@sdk/utils";
import { type SymbolEmoji, toMarketEmojiData } from "@sdk/emoji_data";
import {
  fetchLiquidityEventsByBlock,
  fetchMarketRegistrationEventBySymbolEmojis,
  fetchSwapEventsByBlock,
  getProcessorStatus,
  isLiquidityEventModel,
  type toLiquidityEventModel,
  type toSwapEventModel,
} from "@sdk/indexer-v2";
import { toCoinDecimalString } from "./utils/decimals";
import type { XOR } from "@sdk/utils/utility-types";
import type { Flatten } from "@sdk-types";

export function pairIdToSymbolEmojiString(pairId: string): string {
  return pairId.split("-")[0];
}

export function symbolEmojisToString(symbolEmojis: Array<SymbolEmoji>): string {
  return symbolEmojis.join("");
}

export function symbolEmojiStringToArray(symbolEmojiString: string): SymbolEmoji[] {
  const marketEmojiData = toMarketEmojiData(symbolEmojiString);
  return marketEmojiData.emojis.map((emojiData) => emojiData.emoji);
}

export function pairIdToSymbolEmojis(pairId: string): SymbolEmoji[] {
  const emojiString = pairIdToSymbolEmojiString(pairId);
  return symbolEmojiStringToArray(emojiString);
}

export function symbolEmojisToPairId(symbolEmojis: Array<SymbolEmoji>): string {
  return symbolEmojisToString(symbolEmojis) + "-APT";
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number | string;
  decimals?: number;
  circulatingSupply?: number | string;
  coinGeckoId?: string;
  coinMarketCapId?: string;
  metadata?: Record<string, string>;
}

export interface AssetResponse {
  asset: Asset;
}

export type Asset0In1Out = {
  asset0In: number | string;
  asset1Out: number | string;
};

export type Asset1In0Out = {
  asset0Out: number | string;
  asset1In: number | string;
};

export interface Block {
  blockNumber: number;
  // Whole number representing a UNIX timestamp in seconds.
  blockTimestamp: number;
  metadata?: Record<string, string>;
}

export type AssetInOut = XOR<Asset0In1Out, Asset1In0Out>;

export type DexscreenerReserves = {
  reserves: {
    asset0: number | string;
    asset1: number | string;
  };
};

type SwapEvent = Flatten<
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

export interface EventsResponse {
  events: Event[];
}

export interface LatestBlockResponse {
  block: Block;
}

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

export interface PairResponse {
  pair: Pair;
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

  const { base, quote } = calculateRealReserves(event.state);
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

    maker: event.swap.swapper,
    pairId: symbolEmojisToPairId(event.market.symbolEmojis),

    ...assetInOut,
    priceNative,
    reserves,
  };
}

function toDexscreenerJoinExitEvent(
  event: ReturnType<typeof toLiquidityEventModel>
): JoinExitEvent & BlockInfo {
  const { base, quote } = calculateRealReserves(event.state);
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

    maker: event.liquidity.provider,
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

/**
 * Fetches an asset by a string of the emojis that represent the asset
 * @param assetId
 */
async function getAsset(assetId: string, withDecimals: boolean): Promise<Asset> {
  const marketEmojiData = toMarketEmojiData(assetId);
  const symbolEmojis = symbolEmojiStringToArray(assetId);
  const marketState = await fetchMarketState({ searchEmojis: symbolEmojis });

  const circulatingSupply: { circulatingSupply?: number | string } = {};
  if (marketState && marketState.state) {
    circulatingSupply.circulatingSupply = toNominal(calculateCirculatingSupply(marketState.state));
  }

  return {
    id: assetId,
    name: marketEmojiData.symbolData.name,
    symbol: marketEmojiData.symbolData.symbol,
    totalSupply: toNominal(EMOJICOIN_SUPPLY),
    ...(withDecimals ? { decimals: 8 } : {}),
    ...circulatingSupply,
    // coinGeckoId: assetId,
    // coinMarketCapId: assetId,
  };
}

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

export async function asset(
  request: NextRequest,
  ops = { withDecimals: false }
): Promise<NextResponse<AssetResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get("id");
  if (!assetId) {
    // This is a required field, and is an error otherwise.
    return new NextResponse("id is a parameter", { status: 400 });
  }
  const asset = await getAsset(assetId, ops.withDecimals);
  return NextResponse.json({ asset });
}

export async function events(request: NextRequest): Promise<NextResponse<EventsResponse>> {
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

export async function latestBlock(
  _request: NextRequest
): Promise<NextResponse<LatestBlockResponse>> {
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
      blockTimestamp: Math.floor(status.lastTransactionTimestamp.getTime() / 1000),
    },
  });
}

export async function pair(request: NextRequest): Promise<NextResponse<PairResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const pairId = searchParams.get("id");
  if (!pairId) {
    return new NextResponse("id is a required parameter", { status: 400 });
  }
  const { pair, error } = await getPair(pairId);
  if (error) return error;

  return NextResponse.json({ pair });
}
