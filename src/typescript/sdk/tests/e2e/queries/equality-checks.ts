import {
  type EntryFunctionPayloadResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import {
  type withChatEventData,
  type withGlobalStateEventData,
  type withLastSwap,
  type withLiquidityEventData,
  type withMarketAndStateMetadataAndBumpTime,
  type withMarketAndStateMetadataAndEmitTime,
  type withMarketRegistrationEventData,
  type withPeriodicStateEventData,
  type withPeriodicStateMetadata,
  type withStateEventData,
  type withSwapEventData,
  type withTransactionMetadata,
  type SwapEventModel,
  type GlobalStateEventModel,
  type MarketRegistrationEventModel,
  type ChatEventModel,
  type LiquidityEventModel,
  type PeriodicStateEventModel,
  type MarketLatestStateEventModel,
} from "../../../src/indexer-v2/types";
import {
  calculateTvlGrowth,
  getEvents,
  getMarketResourceFromWriteSet,
  Period,
  rawPeriodToEnum,
  standardizeAddress,
  type Types,
} from "../../../src";
import { type JsonValue } from "../../../src/types/json-types";
import { EmojicoinClient } from "../helpers";

type Indexer = {
  TransactionMetadata: ReturnType<typeof withTransactionMetadata>;
  MarketAndStateMetadataAndBumpTime: ReturnType<typeof withMarketAndStateMetadataAndBumpTime>;
  MarketAndStateMetadataAndEmitTime: ReturnType<typeof withMarketAndStateMetadataAndEmitTime>;
  LastSwap: ReturnType<typeof withLastSwap>;
  GlobalStateEventData: ReturnType<typeof withGlobalStateEventData>;
  PeriodicStateMetadata: ReturnType<typeof withPeriodicStateMetadata>;
  PeriodicStateEventData: ReturnType<typeof withPeriodicStateEventData>;
  MarketRegistrationEventData: ReturnType<typeof withMarketRegistrationEventData>;
  SwapEventData: ReturnType<typeof withSwapEventData>;
  ChatEventData: ReturnType<typeof withChatEventData>;
  LiquidityEventData: ReturnType<typeof withLiquidityEventData>;
  StateEventData: ReturnType<typeof withStateEventData>;
};

const checkTuples = (args: [string, JsonValue | undefined, JsonValue | undefined][]) => {
  const [rows, responses] = args.reduce(
    (acc, [path, row, response]) => {
      acc[0].push(`${path}: ${row?.toString()}`);
      acc[1].push(`${path}: ${response?.toString()}`);
      return acc;
    },
    [[], []] as [JsonValue[], JsonValue[]]
  );

  expect(rows).toEqual(responses);
};

// -------------------------------------------------------------------------------------------------
//
//
//                                     Individual Struct Checks
//
//
// -------------------------------------------------------------------------------------------------

export const compareTransactionMetadata = <T extends Indexer["TransactionMetadata"]>(
  row: T,
  response: UserTransactionResponse
) =>
  checkTuples([
    [
      "row.transaction.entryFunction",
      row.transaction.entryFunction,
      (response.payload as EntryFunctionPayloadResponse).function,
    ],
    ["row.transaction.sender", row.transaction.sender, standardizeAddress(response.sender)],
    ["row.transaction.version", row.transaction.version, BigInt(response.version)],
    ["row.transaction.time", row.transaction.time, BigInt(response.timestamp)],
  ]);

export const compareMarketAndStateMetadata = <
  T extends
    | Indexer["MarketAndStateMetadataAndBumpTime"]
    | Indexer["MarketAndStateMetadataAndEmitTime"],
>(
  row: T,
  event: Types["StateEvent"]
) =>
  checkTuples([
    [
      "row.market.symbolData",
      row.market.symbolData.bytes.join(""),
      event.marketMetadata.emojiBytes.join(""),
    ],
    ["row.market.marketID", row.market.marketID, event.marketMetadata.marketID],
    ["row.market.marketNonce", row.market.marketNonce, event.stateMetadata.marketNonce],
    ["row.market.trigger", row.market.trigger, event.stateMetadata.trigger],
    ["row.market.time", row.market.time, event.stateMetadata.bumpTime],
    ["row.market.marketAddress", row.market.marketAddress, event.marketMetadata.marketAddress],
    [
      "row.market.symbol",
      row.market.symbolEmojis.join(""),
      new TextDecoder().decode(event.marketMetadata.emojiBytes),
    ],
  ]);

export const compareSwapEvents = <T extends Indexer["SwapEventData"]>(
  row: T,
  event: Types["SwapEvent"]
) =>
  checkTuples([
    ["row.swap.swapper", row.swap.swapper, event.swapper],
    ["row.swap.integrator", row.swap.integrator, event.integrator],
    ["row.swap.integratorFee", row.swap.integratorFee, event.integratorFee],
    ["row.swap.inputAmount", row.swap.inputAmount, event.inputAmount],
    ["row.swap.isSell", row.swap.isSell, event.isSell],
    ["row.swap.integratorFeeRateBPs", row.swap.integratorFeeRateBPs, event.integratorFeeRateBPs],
    ["row.swap.netProceeds", row.swap.netProceeds, event.netProceeds],
    ["row.swap.baseVolume", row.swap.baseVolume, event.baseVolume],
    ["row.swap.quoteVolume", row.swap.quoteVolume, event.quoteVolume],
    ["row.swap.avgExecutionPriceQ64", row.swap.avgExecutionPriceQ64, event.avgExecutionPriceQ64],
    ["row.swap.poolFee", row.swap.poolFee, event.poolFee],
    ["row.swap.startsInBondingCurve", row.swap.startsInBondingCurve, event.startsInBondingCurve],
    [
      "row.swap.resultsInStateTransition",
      row.swap.resultsInStateTransition,
      event.resultsInStateTransition,
    ],
    [
      "row.swap.balanceAsFractionOfCirculatingSupplyBeforeQ64",
      row.swap.balanceAsFractionOfCirculatingSupplyBeforeQ64,
      event.balanceAsFractionOfCirculatingSupplyBeforeQ64,
    ],
    [
      "row.swap.balanceAsFractionOfCirculatingSupplyAfterQ64",
      row.swap.balanceAsFractionOfCirculatingSupplyAfterQ64,
      event.balanceAsFractionOfCirculatingSupplyAfterQ64,
    ],
  ]);

export const compareStateEvents = <T extends Indexer["StateEventData"]>(
  row: T,
  event: Types["StateEvent"]
) =>
  checkTuples([
    [
      "row.state.clammVirtualReserves.base",
      row.state.clammVirtualReserves.base,
      event.clammVirtualReserves.base,
    ],
    [
      "row.state.clammVirtualReserves.quote",
      row.state.clammVirtualReserves.quote,
      event.clammVirtualReserves.quote,
    ],
    [
      "row.state.cpammRealReserves.base",
      row.state.cpammRealReserves.base,
      event.cpammRealReserves.base,
    ],
    [
      "row.state.cpammRealReserves.quote",
      row.state.cpammRealReserves.quote,
      event.cpammRealReserves.quote,
    ],
    [
      "row.state.cumulativeStats.baseVolume",
      row.state.cumulativeStats.baseVolume,
      event.cumulativeStats.baseVolume,
    ],
    [
      "row.state.cumulativeStats.integratorFees",
      row.state.cumulativeStats.integratorFees,
      event.cumulativeStats.integratorFees,
    ],
    [
      "row.state.cumulativeStats.numChatMessages",
      row.state.cumulativeStats.numChatMessages,
      event.cumulativeStats.numChatMessages,
    ],
    [
      "row.state.cumulativeStats.numSwaps",
      row.state.cumulativeStats.numSwaps,
      event.cumulativeStats.numSwaps,
    ],
    [
      "row.state.cumulativeStats.poolFeesBase",
      row.state.cumulativeStats.poolFeesBase,
      event.cumulativeStats.poolFeesBase,
    ],
    [
      "row.state.cumulativeStats.poolFeesQuote",
      row.state.cumulativeStats.poolFeesQuote,
      event.cumulativeStats.poolFeesQuote,
    ],
    [
      "row.state.cumulativeStats.quoteVolume",
      row.state.cumulativeStats.quoteVolume,
      event.cumulativeStats.quoteVolume,
    ],
    [
      "row.state.instantaneousStats.fullyDilutedValue",
      row.state.instantaneousStats.fullyDilutedValue,
      event.instantaneousStats.fullyDilutedValue,
    ],
    [
      "row.state.instantaneousStats.marketCap",
      row.state.instantaneousStats.marketCap,
      event.instantaneousStats.marketCap,
    ],
    [
      "row.state.instantaneousStats.totalQuoteLocked",
      row.state.instantaneousStats.totalQuoteLocked,
      event.instantaneousStats.totalQuoteLocked,
    ],
    [
      "row.state.instantaneousStats.totalValueLocked",
      row.state.instantaneousStats.totalValueLocked,
      event.instantaneousStats.totalValueLocked,
    ],
    ["row.state.lpCoinSupply", row.state.lpCoinSupply, event.lpCoinSupply],
  ]);

const compareGlobalStateEvent = <T extends Indexer["GlobalStateEventData"]>(
  row: T,
  event: Types["GlobalStateEvent"]
) =>
  checkTuples([
    ["row.globalState.emitTime", row.globalState.emitTime, event.emitTime],
    ["row.globalState.registryNonce", row.globalState.registryNonce, event.registryNonce],
    ["row.globalState.trigger", row.globalState.trigger, event.trigger],
    [
      "row.globalState.cumulativeQuoteVolume",
      row.globalState.cumulativeQuoteVolume,
      event.cumulativeQuoteVolume,
    ],
    ["row.globalState.totalQuoteLocked", row.globalState.totalQuoteLocked, event.totalQuoteLocked],
    ["row.globalState.totalValueLocked", row.globalState.totalValueLocked, event.totalValueLocked],
    ["row.globalState.marketCap", row.globalState.marketCap, event.marketCap],
    [
      "row.globalState.fullyDilutedValue",
      row.globalState.fullyDilutedValue,
      event.fullyDilutedValue,
    ],
    [
      "row.globalState.cumulativeIntegratorFees",
      row.globalState.cumulativeIntegratorFees,
      event.cumulativeIntegratorFees,
    ],
    ["row.globalState.cumulativeSwaps", row.globalState.cumulativeSwaps, event.cumulativeSwaps],
    [
      "row.globalState.cumulativeChatMessages",
      row.globalState.cumulativeChatMessages,
      event.cumulativeChatMessages,
    ],
  ]);

const comparePeriodicStateMetadata = <T extends Indexer["PeriodicStateMetadata"]>(
  row: T,
  event: Types["PeriodicStateEvent"]
) =>
  checkTuples([
    [
      "row.periodicMetadata.period",
      row.periodicMetadata.period,
      rawPeriodToEnum(event.periodicStateMetadata.period),
    ],
    [
      "row.periodicMetadata.startTime",
      row.periodicMetadata.startTime,
      event.periodicStateMetadata.startTime,
    ],
  ]);

const comparePeriodicStateEvent = <T extends Indexer["PeriodicStateEventData"]>(
  row: T,
  event: Types["PeriodicStateEvent"]
) =>
  checkTuples([
    ["row.periodicState.openPriceQ64", row.periodicState.openPriceQ64, event.openPriceQ64],
    ["row.periodicState.highPriceQ64", row.periodicState.highPriceQ64, event.highPriceQ64],
    ["row.periodicState.lowPriceQ64", row.periodicState.lowPriceQ64, event.lowPriceQ64],
    ["row.periodicState.closePriceQ64", row.periodicState.closePriceQ64, event.closePriceQ64],
    ["row.periodicState.volumeBase", row.periodicState.volumeBase, event.volumeBase],
    ["row.periodicState.volumeQuote", row.periodicState.volumeQuote, event.volumeQuote],
    ["row.periodicState.integratorFees", row.periodicState.integratorFees, event.integratorFees],
    ["row.periodicState.poolFeesBase", row.periodicState.poolFeesBase, event.poolFeesBase],
    ["row.periodicState.poolFeesQuote", row.periodicState.poolFeesQuote, event.poolFeesQuote],
    ["row.periodicState.numSwaps", row.periodicState.numSwaps, event.numSwaps],
    ["row.periodicState.numChatMessages", row.periodicState.numChatMessages, event.numChatMessages],
    [
      "row.periodicState.startsInBondingCurve",
      row.periodicState.startsInBondingCurve,
      event.startsInBondingCurve,
    ],
    [
      "row.periodicState.endsInBondingCurve",
      row.periodicState.endsInBondingCurve,
      event.endsInBondingCurve,
    ],
    [
      "row.periodicState.tvlPerLpCoinGrowthQ64",
      row.periodicState.tvlPerLPCoinGrowthQ64,
      event.tvlPerLPCoinGrowthQ64,
    ],
  ]);

const compareLastSwap = <T extends Indexer["LastSwap"]>(row: T, event: Types["StateEvent"]) =>
  checkTuples([
    ["row.lastSwap.isSell", row.lastSwap.isSell, event.lastSwap.isSell],
    [
      "row.lastSwap.avgExecutionPriceQ64",
      row.lastSwap.avgExecutionPriceQ64,
      event.lastSwap.avgExecutionPriceQ64,
    ],
    ["row.lastSwap.baseVolume", row.lastSwap.baseVolume, event.lastSwap.baseVolume],
    ["row.lastSwap.quoteVolume", row.lastSwap.quoteVolume, event.lastSwap.quoteVolume],
    ["row.lastSwap.nonce", row.lastSwap.nonce, event.lastSwap.nonce],
    ["row.lastSwap.time", row.lastSwap.time, event.lastSwap.time],
  ]);

const compareMarketRegistrationEvent = <T extends Indexer["MarketRegistrationEventData"]>(
  row: T,
  event: Types["MarketRegistrationEvent"]
) =>
  checkTuples([
    ["row.marketRegistration.registrant", row.marketRegistration.registrant, event.registrant],
    ["row.marketRegistration.integrator", row.marketRegistration.integrator, event.integrator],
    [
      "row.marketRegistration.integratorFee",
      row.marketRegistration.integratorFee,
      event.integratorFee,
    ],
  ]);

const compareChatEvents = <T extends Indexer["ChatEventData"]>(row: T, event: Types["ChatEvent"]) =>
  checkTuples([
    ["row.chat.user", row.chat.user, event.user],
    ["row.chat.message", row.chat.message, event.message],
    ["row.chat.userEmojicoinBalance", row.chat.userEmojicoinBalance, event.userEmojicoinBalance],
    ["row.chat.circulatingSupply", row.chat.circulatingSupply, event.circulatingSupply],
    [
      "row.chat.balanceAsFractionOfCirculatingSupplyQ64",
      row.chat.balanceAsFractionOfCirculatingSupplyQ64,
      event.balanceAsFractionOfCirculatingSupplyQ64,
    ],
  ]);

const compareLiquidityEvents = <T extends Indexer["LiquidityEventData"]>(
  row: T,
  event: Types["LiquidityEvent"]
) =>
  checkTuples([
    ["row.liquidity.provider", row.liquidity.provider, event.provider],
    ["row.liquidity.baseAmount", row.liquidity.baseAmount, event.baseAmount],
    ["row.liquidity.quoteAmount", row.liquidity.quoteAmount, event.quoteAmount],
    ["row.liquidity.lpCoinAmount", row.liquidity.lpCoinAmount, event.lpCoinAmount],
    ["row.liquidity.liquidityProvided", row.liquidity.liquidityProvided, event.liquidityProvided],
    [
      "row.liquidity.baseDonationClaimAmount",
      row.liquidity.baseDonationClaimAmount,
      event.baseDonationClaimAmount,
    ],
    [
      "row.liquidity.quoteDonationClaimAmount",
      row.liquidity.quoteDonationClaimAmount,
      event.quoteDonationClaimAmount,
    ],
  ]);

const GlobalState = (row: GlobalStateEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const globalStateEvent = events.globalStateEvents[0];

  compareTransactionMetadata(row, response);
  compareGlobalStateEvent(row, globalStateEvent);
};

// -------------------------------------------------------------------------------------------------
//
//
//                                  Database Model Checks by Row Type
//
//
// -------------------------------------------------------------------------------------------------

const PeriodicState = (row: PeriodicStateEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const periodicStateEvent = events.periodicStateEvents[0];
  const stateEvent = events.stateEvents[0];

  compareTransactionMetadata(row, response);
  compareMarketAndStateMetadata(row, stateEvent);
  compareLastSwap(row, stateEvent);
  comparePeriodicStateEvent(row, periodicStateEvent);
  comparePeriodicStateMetadata(row, periodicStateEvent);
};

const MarketRegistration = <T extends MarketRegistrationEventModel>(
  row: T,
  response: UserTransactionResponse
) => {
  const events = getEvents(response);
  const registerEvent = events.marketRegistrationEvents[0];
  const stateEvent = events.stateEvents[0];

  compareTransactionMetadata(row, response);
  compareMarketAndStateMetadata(row, stateEvent);
  compareMarketRegistrationEvent(row, registerEvent);
};

const Swap = (row: SwapEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const swapEvent = events.swapEvents[0];
  const stateEvent = events.stateEvents[0];

  compareTransactionMetadata(row, response);
  compareMarketAndStateMetadata(row, stateEvent);
  compareStateEvents(row, stateEvent);
  compareSwapEvents(row, swapEvent);
};

const Chat = (row: ChatEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const chatEvent = events.chatEvents[0];
  const stateEvent = events.stateEvents[0];

  compareTransactionMetadata(row, response);
  compareMarketAndStateMetadata(row, stateEvent);
  compareLastSwap(row, stateEvent);
  compareChatEvents(row, chatEvent);
};

const Liquidity = (row: LiquidityEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const liquidityEvent = events.liquidityEvents[0];
  const stateEvent = events.stateEvents[0];

  compareTransactionMetadata(row, response);
  compareMarketAndStateMetadata(row, stateEvent);
  compareLastSwap(row, stateEvent);
  compareLiquidityEvents(row, liquidityEvent);
};

const MarketLatestState = (row: MarketLatestStateEventModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const stateEvent = events.stateEvents[0];
  const { marketAddress } = stateEvent.marketMetadata;
  const marketResource = getMarketResourceFromWriteSet(response, marketAddress);
  if (!marketResource) {
    throw new Error("There should be a market resource in the response.");
  }

  const volumeInStateTrackerFromWriteSet = marketResource.periodicStateTrackers.find(
    (p) => rawPeriodToEnum(p.period) === Period.Period1M
  )!.volumeQuote;

  const periodicStateTracker1D = marketResource.periodicStateTrackers.find(
    (p) => rawPeriodToEnum(p.period) === Period.Period1D
  )!;

  expect(volumeInStateTrackerFromWriteSet).toBeDefined();
  expect(periodicStateTracker1D).toBeDefined();

  compareMarketAndStateMetadata(row, stateEvent);
  compareTransactionMetadata(row, response);
  compareStateEvents(row, stateEvent);

  expect(row.dailyTvlPerLPCoinGrowth).toEqual(calculateTvlGrowth(periodicStateTracker1D));
  expect(row.inBondingCurve).toEqual(stateEvent.lpCoinSupply === BigInt(0));
  expect(row.volumeIn1MStateTracker).toEqual(volumeInStateTrackerFromWriteSet);
};

const RowEqualityChecks = {
  GlobalState,
  PeriodicState,
  MarketRegistration,
  Swap,
  Chat,
  Liquidity,
  MarketLatestState,
};

export default RowEqualityChecks;
