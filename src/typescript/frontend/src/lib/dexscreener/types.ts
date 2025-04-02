import type { XOR } from "@/sdk/utils/utility-types";
import type { Flatten } from "@/sdk-types";

export interface Asset {
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

export type JoinExitEvent = Flatten<
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

export type BlockInfo = { block: Block };
export type Event = (SwapEvent | JoinExitEvent) & BlockInfo;

export interface EventsResponse {
  events: Event[];
}

export interface LatestBlockResponse {
  block: Block;
}

export interface Pair {
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
