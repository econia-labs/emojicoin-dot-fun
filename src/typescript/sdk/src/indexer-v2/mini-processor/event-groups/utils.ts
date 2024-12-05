import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { rawPeriodToEnum } from "../../const";
import {
  GuidGetters,
  type MarketMetadataModel,
  type StateEventData,
  type DatabaseModels,
  toTransactionMetadataForUserLiquidityPools,
  type TransactionMetadata,
} from "../../indexer-v2/types";
import { type BumpEvent } from "./builder";
import {
  isChatEvent,
  isLiquidityEvent,
  isMarketRegistrationEvent,
  isSwapEvent,
  type Types,
} from "../../types";
import { type EventsModels, type UserLiquidityPoolsMap } from ".";
import { type AccountAddressString } from "../../emojicoin_dot_fun";
import { getLPCoinBalanceFromWriteSet } from "../parse-write-set";

const toChatEventData = (event: Types["ChatEvent"]): DatabaseModels["chat_events"]["chat"] => ({
  user: event.user,
  message: event.message,
  userEmojicoinBalance: event.userEmojicoinBalance,
  circulatingSupply: event.circulatingSupply,
  balanceAsFractionOfCirculatingSupplyQ64: event.balanceAsFractionOfCirculatingSupplyQ64,
});

const toMarketRegistrationEventData = (
  event: Types["MarketRegistrationEvent"]
): DatabaseModels["market_registration_events"]["marketRegistration"] => ({
  registrant: event.registrant,
  integrator: event.integrator,
  integratorFee: event.integratorFee,
});

const toSwapEventData = (event: Types["SwapEvent"]): DatabaseModels["swap_events"]["swap"] => ({
  swapper: event.swapper,
  integrator: event.integrator,
  integratorFee: event.integratorFee,
  inputAmount: event.inputAmount,
  isSell: event.isSell,
  integratorFeeRateBPs: event.integratorFeeRateBPs,
  netProceeds: event.netProceeds,
  baseVolume: event.baseVolume,
  quoteVolume: event.quoteVolume,
  avgExecutionPriceQ64: event.avgExecutionPriceQ64,
  poolFee: event.poolFee,
  startsInBondingCurve: event.startsInBondingCurve,
  resultsInStateTransition: event.resultsInStateTransition,
  balanceAsFractionOfCirculatingSupplyBeforeQ64:
    event.balanceAsFractionOfCirculatingSupplyBeforeQ64,
  balanceAsFractionOfCirculatingSupplyAfterQ64: event.balanceAsFractionOfCirculatingSupplyAfterQ64,
});

const toLiquidityEventData = (
  event: Types["LiquidityEvent"]
): DatabaseModels["liquidity_events"]["liquidity"] => ({
  provider: event.provider,
  baseAmount: event.baseAmount,
  quoteAmount: event.quoteAmount,
  lpCoinAmount: event.lpCoinAmount,
  liquidityProvided: event.liquidityProvided,
  baseDonationClaimAmount: event.baseDonationClaimAmount,
  quoteDonationClaimAmount: event.quoteDonationClaimAmount,
});

export const addModelsForBumpEvent = (args: {
  rows: Omit<EventsModels, "userPools"> & { userPools: UserLiquidityPoolsMap };
  transaction: TransactionMetadata;
  market: MarketMetadataModel;
  state: StateEventData;
  lastSwap: Types["LastSwap"];
  event: BumpEvent;
  response?: UserTransactionResponse; // If we're parsing the WriteSet.
}) => {
  const { rows, transaction, market, state, lastSwap, event, response } = args;
  if (isChatEvent(event)) {
    rows.chatEvents.push({
      transaction,
      market,
      state,
      lastSwap,
      chat: toChatEventData(event),
      ...GuidGetters.chatEvent(market),
    });
  } else if (isMarketRegistrationEvent(event)) {
    rows.marketRegistrationEvents.push({
      transaction,
      market,
      marketRegistration: toMarketRegistrationEventData(event),
      ...GuidGetters.marketRegistrationEvent(market),
    });
  } else if (isLiquidityEvent(event)) {
    const liquidity = toLiquidityEventData(event);
    const liquidityEventModel: DatabaseModels["liquidity_events"] = {
      transaction,
      market,
      state,
      lastSwap,
      liquidity,
      ...GuidGetters.liquidityEvent(market),
    };

    rows.liquidityEvents.push(liquidityEventModel);

    const key = [event.provider, event.marketID] as [AccountAddressString, bigint];
    const currPool = rows.userPools.get(key);
    const newPool: DatabaseModels["user_liquidity_pools"] = {
      transaction: toTransactionMetadataForUserLiquidityPools(transaction),
      liquidity,
      market,
      lpCoinBalance: response
        ? getLPCoinBalanceFromWriteSet({
            response,
            symbolBytes: market.symbolData.bytes,
            userAddress: liquidity.provider,
          })
        : 0n,
    };

    if (!currPool || currPool.market.marketNonce < newPool.market.marketNonce) {
      rows.userPools.set(key, newPool);
    }
  } else if (isSwapEvent(event)) {
    rows.swapEvents.push({
      transaction,
      market,
      state,
      swap: toSwapEventData(event),
      ...GuidGetters.swapEvent(market),
    });
  } else {
    throw new Error("Invalid bump event type.");
  }
};

export const toPeriodicStateEventData = (args: {
  transaction: TransactionMetadata;
  market: MarketMetadataModel;
  stateEvent: Types["StateEvent"];
  periodicStateEvent: Types["PeriodicStateEvent"];
}): DatabaseModels["periodic_state_events"] => {
  const { transaction, market, stateEvent, periodicStateEvent: event } = args;
  const period = rawPeriodToEnum(event.periodicStateMetadata.period);
  return {
    transaction,
    market,
    lastSwap: stateEvent.lastSwap,
    periodicMetadata: {
      period,
      startTime: event.periodicStateMetadata.startTime,
    },
    periodicState: {
      openPriceQ64: event.openPriceQ64,
      highPriceQ64: event.highPriceQ64,
      lowPriceQ64: event.lowPriceQ64,
      closePriceQ64: event.closePriceQ64,
      volumeBase: event.volumeBase,
      volumeQuote: event.volumeQuote,
      integratorFees: event.integratorFees,
      poolFeesBase: event.poolFeesBase,
      poolFeesQuote: event.poolFeesQuote,
      numSwaps: event.numSwaps,
      numChatMessages: event.numChatMessages,
      startsInBondingCurve: event.startsInBondingCurve,
      endsInBondingCurve: event.endsInBondingCurve,
      tvlPerLPCoinGrowthQ64: event.tvlPerLPCoinGrowthQ64,
    },
    ...GuidGetters.periodicStateEvent({ ...market, period }),
  };
};
