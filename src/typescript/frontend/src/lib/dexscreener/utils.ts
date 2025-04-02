import { DECIMALS } from "@/sdk/const";
import { type SymbolEmoji, toMarketEmojiData } from "@/sdk/emoji_data";
import type { toLiquidityEventModel, toSwapEventModel } from "@/sdk/indexer-v2";
import { calculateCurvePrice, calculateRealReserves } from "@/sdk/markets";

import { toCoinDecimalString } from "../utils/decimals";
import type { BlockInfo, JoinExitEvent, SwapEvent } from "./types";

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

export function toDexscreenerSwapEvent(
  event: ReturnType<typeof toSwapEventModel>
): SwapEvent & BlockInfo {
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

export function toDexscreenerJoinExitEvent(
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
