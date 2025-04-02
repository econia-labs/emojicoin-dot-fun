import { INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { type NextRequest, NextResponse } from "next/server";

import { calculateCirculatingSupply, EMOJICOIN_SUPPLY, toMarketEmojiData } from "@/sdk/index";
import {
  fetchLiquidityEventsByBlock,
  fetchMarketRegistrationEventBySymbolEmojis,
  fetchMarketState,
  fetchSwapEventsByBlock,
  getProcessorStatus,
  isLiquidityEventModel,
} from "@/sdk/indexer-v2";
import { compareBigInt, getAptosClient, toNominal } from "@/sdk/utils";

import type { AssetResponse, EventsResponse, LatestBlockResponse, PairResponse } from "./types";
import {
  pairIdToSymbolEmojis,
  symbolEmojisToString,
  symbolEmojiStringToArray,
  toDexscreenerJoinExitEvent,
  toDexscreenerSwapEvent,
} from "./utils";

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
  const marketEmojiData = toMarketEmojiData(assetId);
  const symbolEmojis = symbolEmojiStringToArray(assetId);
  const marketState = await fetchMarketState({ searchEmojis: symbolEmojis });

  const circulatingSupply: { circulatingSupply?: number | string } = {};
  if (marketState && marketState.state) {
    circulatingSupply.circulatingSupply = toNominal(calculateCirculatingSupply(marketState.state));
  }

  return NextResponse.json({
    asset: {
      id: assetId,
      name: marketEmojiData.symbolData.name,
      symbol: marketEmojiData.symbolData.symbol,
      totalSupply: toNominal(EMOJICOIN_SUPPLY),
      ...(ops.withDecimals ? { decimals: 8 } : {}),
      ...circulatingSupply,
    },
  });
}

export async function events(request: NextRequest): Promise<NextResponse<EventsResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const fromBlock = searchParams.get("fromBlock");
  const toBlock = searchParams.get("toBlock");
  if (fromBlock === null || toBlock === null) {
    // This should never happen, and is an invalid call
    return new NextResponse("fromBlock and toBlock are required parameters", { status: 400 });
  }

  const [fromBlockInt, toBlockInt] = [parseInt(fromBlock, 10), parseInt(toBlock, 10)];

  const swapEvents = await fetchSwapEventsByBlock({ fromBlock: fromBlockInt, toBlock: toBlockInt });
  const liquidityEvents = await fetchLiquidityEventsByBlock({
    fromBlock: fromBlockInt,
    toBlock: toBlockInt,
  });

  // Merge these two arrays by their `transaction.version`
  const events = [...swapEvents, ...liquidityEvents]
    .sort((a, b) => compareBigInt(a.transaction.version, b.transaction.version))
    .map((event) =>
      isLiquidityEventModel(event)
        ? toDexscreenerJoinExitEvent(event)
        : toDexscreenerSwapEvent(event)
    );

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

  const symbolEmojis = pairIdToSymbolEmojis(pairId);

  const marketRegistrations = await fetchMarketRegistrationEventBySymbolEmojis({
    searchEmojis: symbolEmojis,
  });
  const marketRegistration = marketRegistrations.pop();
  if (!marketRegistration) {
    return new NextResponse(`Market registration not found for pairId: ${pairId}`, {
      status: 404,
    });
  }

  const aptos = getAptosClient();
  const block = await aptos.getBlockByVersion({
    ledgerVersion: marketRegistration.transaction.version,
  });

  return NextResponse.json({
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
  });
}
