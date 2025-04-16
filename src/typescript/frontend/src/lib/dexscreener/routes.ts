import { INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { type NextRequest, NextResponse } from "next/server";

import type { MarketRegistrationEventModel, MarketStateModel } from "@/sdk/index";
import { calculateCirculatingSupply, EMOJICOIN_SUPPLY, toMarketEmojiData } from "@/sdk/index";
import {
  fetchLiquidityEventsByBlock,
  fetchMarketRegistrationByAddress,
  fetchMarketRegistrationEventBySymbolEmojis,
  fetchMarketState,
  fetchMarketStateByAddress,
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
  ops = { geckoTerminal: false }
): Promise<NextResponse<AssetResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get("id");
  if (!assetId) {
    // This is a required field, and is an error otherwise.
    return new NextResponse("id is a parameter", { status: 400 });
  }

  let marketState: MarketStateModel | null;

  if (ops.geckoTerminal) {
    if (!/^0x[a-f0-9]{64}::coin_factory::Emojicoin$/.test(assetId)) {
      return new NextResponse(
        "Asset ID must follow the form: 0x[a-f0-9]{64}::coin_factory::Emojicoin",
        { status: 400 }
      );
    }
    const marketAddress = assetId.split(/::/)[0];
    marketState = await fetchMarketStateByAddress({ address: marketAddress });
  } else {
    const symbolEmojis = symbolEmojiStringToArray(assetId);
    marketState = await fetchMarketState({ searchEmojis: symbolEmojis });
  }

  if (!marketState) {
    return new NextResponse("Could not find asset", { status: 404 });
  }

  const marketEmojiData = toMarketEmojiData(marketState.market.symbolEmojis.join(""));

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
      ...(ops.geckoTerminal ? { decimals: 8 } : {}),
      ...circulatingSupply,
    },
  });
}

export async function events(
  request: NextRequest,
  ops = { geckoTerminal: false }
): Promise<NextResponse<EventsResponse>> {
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
        ? toDexscreenerJoinExitEvent(event, ops)
        : toDexscreenerSwapEvent(event, ops)
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

export async function pair(
  request: NextRequest,
  options: { geckoTerminal: boolean } = { geckoTerminal: false }
): Promise<NextResponse<PairResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const pairId = searchParams.get("id");
  if (!pairId) {
    return new NextResponse("id is a required parameter", { status: 400 });
  }

  let marketRegistration: MarketRegistrationEventModel | undefined | null;
  let asset0Id: string;
  let asset1Id: string;

  if (options.geckoTerminal) {
    if (!/^0x[a-f0-9]{64}$/.test(pairId)) {
      return new NextResponse("Pair ID must follow the form: 0x[a-f0-9]{64}", { status: 400 });
    }
    marketRegistration = await fetchMarketRegistrationByAddress({
      marketAddress: pairId as `0x${string}`,
    });
    asset0Id = `${marketRegistration?.market.marketAddress}::coin_factory::Emojicoin`;
    asset1Id = "0x1::aptos_coin::AptosCoin";
  } else {
    const symbolEmojis = pairIdToSymbolEmojis(pairId);
    if (pairId != `${symbolEmojis.join("")}-APT`) {
      return new NextResponse("id is not a valid pair ID", { status: 400 });
    }

    const marketRegistrations = await fetchMarketRegistrationEventBySymbolEmojis({
      searchEmojis: symbolEmojis,
    });
    marketRegistration = marketRegistrations.pop();
    asset0Id = symbolEmojisToString(symbolEmojis);
    asset1Id = "APT";
  }

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
      asset0Id,
      asset1Id,
      createdAtBlockNumber: parseInt(block.block_height),
      createdAtBlockTimestamp: Math.floor(
        marketRegistration.transaction.timestamp.getTime() / 1000
      ),
      createdAtTxnId: String(marketRegistration.transaction.version),
      feeBps: INTEGRATOR_FEE_RATE_BPS,
    },
  });
}
