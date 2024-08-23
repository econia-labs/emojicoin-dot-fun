import { AccountAddressString, HexString } from "../../emojicoin_dot_fun";
import {
  Flatten,
  toCumulativeStats,
  toInstantaneousStats,
  toLastSwap,
  toReserves,
  Types,
} from "../../types";
import { ValueOf } from "../../utils/utility-types";
import { Database } from "../database.types";
import { DatabaseDataTypes, DatabaseSnakeCaseModels } from "./snake-case-types";

export enum Period {
  Period1M = "period_1m",
  Period5M = "period_5m",
  Period15M = "period_15m",
  Period30M = "period_30m",
  Period1H = "period_1h",
  Period4H = "period_4h",
  Period1D = "period_1d",
}

export enum Trigger {
  PackagePublication = "package_publication",
  MarketRegistration = "market_registration",
  SwapBuy = "swap_buy",
  SwapSell = "swap_sell",
  ProvideLiquidity = "provide_liquidity",
  RemoveLiquidity = "remove_liquidity",
  Chat = "chat",
}

export const toPeriod = (s: string) =>
  ({
    period_1m: Period.Period1M,
    period_5m: Period.Period5M,
    period_15m: Period.Period15M,
    period_30m: Period.Period30M,
    period_1h: Period.Period1H,
    period_4h: Period.Period4H,
    period_1d: Period.Period1D,
  })[s as ValueOf<typeof Period>] ??
  (() => {
    throw new Error(`Unknown period: ${s}`);
  })();

export const toTrigger = (s: string) =>
  ({
    package_publication: Trigger.PackagePublication,
    market_registration: Trigger.MarketRegistration,
    swap_buy: Trigger.SwapBuy,
    swap_sell: Trigger.SwapSell,
    provide_liquidity: Trigger.ProvideLiquidity,
    remove_liquidity: Trigger.RemoveLiquidity,
    chat: Trigger.Chat,
  })[s as ValueOf<typeof Trigger>] ??
  (() => {
    throw new Error(`Unknown trigger: ${s}`);
  })();

type TransactionMetadata = {
  transactionVersion: bigint;
  sender: AccountAddressString;
  entryFunction?: string | null;
  transactionTimestamp: Date;
  insertedAt: Date;
};

const toTransactionMetadata = (
  data: DatabaseDataTypes["TransactionMetadata"]
): TransactionMetadata => ({
  transactionVersion: BigInt(data.transaction_version),
  sender: data.sender,
  entryFunction: data.entry_function,
  transactionTimestamp: data.transaction_timestamp,
  insertedAt: data.inserted_at,
});

type MarketAndStateMetadata = {
  marketID: bigint;
  symbolBytes: HexString;
  emitTime: Date;
  marketNonce: bigint;
  trigger: Trigger;
};

const toMarketAndStateMetadata = (
  data: DatabaseDataTypes["MarketAndStateMetadata"]
): MarketAndStateMetadata => ({
  marketID: BigInt(data.market_id),
  symbolBytes: data.symbol_bytes,
  emitTime: data.emit_time,
  marketNonce: BigInt(data.market_nonce),
  trigger: toTrigger(data.trigger),
});

type LastSwapData = Omit<Types.LastSwap, "time"> & { time: Date };

const toLastSwapData = (data: DatabaseDataTypes["LastSwapData"]): LastSwapData => ({
  ...toLastSwap({
    is_sell: data.last_swap_is_sell,
    avg_execution_price_q64: data.last_swap_avg_execution_price_q64,
    base_volume: data.last_swap_base_volume,
    quote_volume: data.last_swap_quote_volume,
    nonce: data.last_swap_nonce,
    time: "0",
  }),
  time: data.last_swap_time,
});

type GlobalStateEventData = {
  emitTime: Date;
  registryNonce: bigint;
  trigger: Trigger;
  cumulativeQuoteVolume: bigint;
  totalQuoteLocked: bigint;
  totalValueLocked: bigint;
  marketCap: bigint;
  fullyDilutedValue: bigint;
  cumulativeIntegratorFees: bigint;
  cumulativeSwaps: bigint;
  cumulativeChatMessages: bigint;
};

const toGlobalStateEventData = (
  data: DatabaseDataTypes["GlobalStateEventData"]
): GlobalStateEventData => ({
  emitTime: data.emit_time,
  registryNonce: BigInt(data.registry_nonce),
  trigger: toTrigger(data.trigger),
  cumulativeQuoteVolume: BigInt(data.cumulative_quote_volume),
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  marketCap: BigInt(data.market_cap),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
  cumulativeIntegratorFees: BigInt(data.cumulative_integrator_fees),
  cumulativeSwaps: BigInt(data.cumulative_swaps),
  cumulativeChatMessages: BigInt(data.cumulative_chat_messages),
});

type PeriodicStateMetadata = {
  period: Period;
  startTime: Date;
};

const toPeriodicStateMetadata = (
  data: DatabaseDataTypes["PeriodicStateMetadata"]
): PeriodicStateMetadata => ({
  period: toPeriod(data.period),
  startTime: data.start_time,
});

type PeriodicStateEventData = {
  openPriceQ64: bigint;
  highPriceQ64: bigint;
  lowPriceQ64: bigint;
  closePriceQ64: bigint;
  volumeBase: bigint;
  volumeQuote: bigint;
  integratorFees: bigint;
  poolFeesBase: bigint;
  poolFeesQuote: bigint;
  nSwaps: bigint;
  nChatMessages: bigint;
  startsInBondingCurve: boolean;
  endsInBondingCurve: boolean;
  tvlPerLpCoinGrowthQ64: bigint;
};

const toPeriodicStateEventData = (
  data: DatabaseDataTypes["PeriodicStateEventData"]
): PeriodicStateEventData => ({
  openPriceQ64: BigInt(data.open_price_q64),
  highPriceQ64: BigInt(data.high_price_q64),
  lowPriceQ64: BigInt(data.low_price_q64),
  closePriceQ64: BigInt(data.close_price_q64),
  volumeBase: BigInt(data.volume_base),
  volumeQuote: BigInt(data.volume_quote),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  nSwaps: BigInt(data.n_swaps),
  nChatMessages: BigInt(data.n_chat_messages),
  startsInBondingCurve: data.starts_in_bonding_curve,
  endsInBondingCurve: data.ends_in_bonding_curve,
  tvlPerLpCoinGrowthQ64: BigInt(data.tvl_per_lp_coin_growth_q64),
});

type MarketRegistrationEventData = {
  registrant: AccountAddressString;
  integrator: AccountAddressString;
  integratorFee: bigint;
};

const toMarketRegistrationEventData = (
  data: DatabaseDataTypes["MarketRegistrationEventData"]
): MarketRegistrationEventData => ({
  registrant: data.registrant,
  integrator: data.integrator,
  integratorFee: BigInt(data.integrator_fee),
});

type SwapEventData = {
  swapper: AccountAddressString;
  integrator: AccountAddressString;
  integratorFee: bigint;
  inputAmount: bigint;
  isSell: boolean;
  integratorFeeRateBps: number;
  netProceeds: bigint;
  baseVolume: bigint;
  quoteVolume: bigint;
  avgExecutionPriceQ64: bigint;
  poolFee: bigint;
  startsInBondingCurve: boolean;
  resultsInStateTransition: boolean;
  balanceAsFractionOfCirculatingSupplyBeforeQ64: bigint;
  balanceAsFractionOfCirculatingSupplyAfterQ64: bigint;
};

const toSwapEventData = (data: DatabaseDataTypes["SwapEventData"]): SwapEventData => ({
  swapper: data.swapper,
  integrator: data.integrator,
  integratorFee: BigInt(data.integrator_fee),
  inputAmount: BigInt(data.input_amount),
  isSell: data.is_sell,
  integratorFeeRateBps: data.integrator_fee_rate_bps,
  netProceeds: BigInt(data.net_proceeds),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  avgExecutionPriceQ64: BigInt(data.avg_execution_price_q64),
  poolFee: BigInt(data.pool_fee),
  startsInBondingCurve: data.starts_in_bonding_curve,
  resultsInStateTransition: data.results_in_state_transition,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_before_q64
  ),
  balanceAsFractionOfCirculatingSupplyAfterQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_after_q64
  ),
});

type LiquidityEventData = {
  provider: AccountAddressString;
  baseAmount: bigint;
  quoteAmount: bigint;
  lpCoinAmount: bigint;
  liquidityProvided: boolean;
  baseDonationClaimAmount: bigint;
  quoteDonationClaimAmount: bigint;
};

const toLiquidityEventData = (
  data: DatabaseDataTypes["LiquidityEventData"]
): LiquidityEventData => ({
  provider: data.provider,
  baseAmount: BigInt(data.base_amount),
  quoteAmount: BigInt(data.quote_amount),
  lpCoinAmount: BigInt(data.lp_coin_amount),
  liquidityProvided: data.liquidity_provided,
  baseDonationClaimAmount: BigInt(data.base_donation_claim_amount),
  quoteDonationClaimAmount: BigInt(data.quote_donation_claim_amount),
});

type ChatEventData = {
  user: AccountAddressString;
  message: string;
  userEmojicoinBalance: bigint;
  circulatingSupply: bigint;
  balanceAsFractionOfCirculatingSupplyQ64: bigint;
};

const toChatEventData = (data: DatabaseDataTypes["ChatEventData"]): ChatEventData => ({
  user: data.user,
  message: data.message,
  userEmojicoinBalance: BigInt(data.user_emojicoin_balance),
  circulatingSupply: BigInt(data.circulating_supply),
  balanceAsFractionOfCirculatingSupplyQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
});

type StateEventData = {
  clammVirtualReserves: Types.Reserves;
  cpammRealReserves: Types.Reserves;
  lpCoinSupply: bigint;
  cumulativeStats: Types.CumulativeStats;
  instantaneousStats: Types.InstantaneousStats;
};

const toStateEventData = (data: DatabaseDataTypes["StateEventData"]): StateEventData => ({
  clammVirtualReserves: toReserves({
    base: data.clamm_virtual_reserves_base,
    quote: data.clamm_virtual_reserves_quote,
  }),
  cpammRealReserves: toReserves({
    base: data.cpamm_real_reserves_base,
    quote: data.cpamm_real_reserves_quote,
  }),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  cumulativeStats: toCumulativeStats({
    base_volume: data.cumulative_stats_base_volume,
    quote_volume: data.cumulative_stats_quote_volume,
    integrator_fees: data.cumulative_stats_integrator_fees,
    pool_fees_base: data.cumulative_stats_pool_fees_base,
    pool_fees_quote: data.cumulative_stats_pool_fees_quote,
    n_swaps: data.cumulative_stats_n_swaps,
    n_chat_messages: data.cumulative_stats_n_chat_messages,
  }),
  instantaneousStats: toInstantaneousStats({
    total_quote_locked: data.instantaneous_stats_total_quote_locked,
    total_value_locked: data.instantaneous_stats_total_value_locked,
    market_cap: data.instantaneous_stats_market_cap,
    fully_diluted_value: data.instantaneous_stats_fully_diluted_value,
  }),
});

type WithTransactionMetadata = { transaction: TransactionMetadata };
type WithMarketAndStateMetadata = { market: MarketAndStateMetadata };
type WithLastSwapData = { lastSwap: LastSwapData };
type WithGlobalStateEventData = { globalState: GlobalStateEventData };
type WithPeriodicStateMetadata = { periodicState: PeriodicStateMetadata };
type WithPeriodicStateEventData = { periodicState: PeriodicStateEventData };
type WithMarketRegistrationEventData = { marketRegistration: MarketRegistrationEventData };
type WithSwapEventData = { swap: SwapEventData };
type WithChatEventData = { chat: ChatEventData };
type WithLiquidityEventData = { liquidity: LiquidityEventData };
type WithStateEventData = { state: StateEventData };

export type GlobalStateEventModel = Flatten<WithTransactionMetadata & WithGlobalStateEventData>;
export type PeriodicStateEventModel = Flatten<
  WithTransactionMetadata &
    WithMarketAndStateMetadata &
    WithLastSwapData &
    WithPeriodicStateMetadata &
    WithPeriodicStateEventData
>;
export type MarketRegistrationEventModel = Flatten<
  WithTransactionMetadata & WithMarketAndStateMetadata & WithMarketRegistrationEventData>;
export type SwapEventModel = Flatten<
  WithTransactionMetadata &
    WithMarketAndStateMetadata &
    WithLastSwapData &
    WithSwapEventData &
    WithStateEventData
>;
export type ChatEventModel = Flatten<
  WithTransactionMetadata & WithMarketAndStateMetadata & WithChatEventData & WithStateEventData
>;
export type LiquidityEventModel = Flatten<
  WithTransactionMetadata & WithMarketAndStateMetadata & WithLiquidityEventData & WithStateEventData
>;
export type MarketLatestStateEventModel = Flatten<
  WithTransactionMetadata &
    WithMarketAndStateMetadata &
    WithStateEventData & {
      dailyTvlPerLPCoinGrowthQ64: bigint;
      inBondingCurve: boolean;
      volumeIn1MStateTracker: bigint;
    }
>;
export type UserLiquidityPoolsModel = Flatten<
  {
    transactionVersion: bigint;
    transactionTimestamp: Date;
    insertedAt: Date;
  } & { market: Flatten<Omit<MarketAndStateMetadata, "emitTime">> } & { bumpTime: Date } & WithLiquidityEventData
>;

export type MarketDailyVolumeModel = Flatten<{
  marketID: bigint;
  dailyVolume: bigint;
}>;

export type Market1MPeriodsInLastDay = Flatten<{
  marketID: bigint;
  transactionVersion: bigint;
  insertedAt: Date;
  nonce: bigint;
  volume: bigint;
  startTime: Date;
}>;

export type DatabaseModels = {
  GlobalStateEventModel: Flatten<TransactionMetadata & GlobalStateEventData>;
  PeriodicStateEventModel: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      LastSwapData &
      PeriodicStateMetadata &
      PeriodicStateEventData
  >;
  MarketRegistrationEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & MarketRegistrationEventData
  >;
  SwapEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & LastSwapData & SwapEventData & StateEventData
  >;
  ChatEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & ChatEventData & StateEventData
  >;
  LiquidityEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & LiquidityEventData & StateEventData
  >;
  MarketLatestStateEventModel: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      StateEventData & {
        dailyTvlPerLPCoinGrowthQ64: bigint;
        inBondingCurve: boolean;
        volumeIn1MStateTracker: bigint;
      }
  >;
  UserLiquidityPoolsModel: Flatten<
    {
      transactionVersion: bigint;
      transactionTimestamp: Date;
      insertedAt: Date;
    } & Omit<MarketAndStateMetadata, "emitTime"> & { bumpTime: Date } & LiquidityEventData
  >;
  MarketDailyVolumeModel: Flatten<{
    marketID: bigint;
    dailyVolume: bigint;
  }>;
  Market1MPeriodsInLastDay: Flatten<{
    marketID: bigint;
    transactionVersion: bigint;
    insertedAt: Date;
    nonce: bigint;
    volume: bigint;
    startTime: Date;
  }>;
};

export const toGlobalStateEventModel = (
  data: DatabaseSnakeCaseModels["GlobalStateEventModel"]
): DatabaseModels["GlobalStateEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toGlobalStateEventData(data),
});

export const toPeriodicStateEventModel = (
  data: DatabaseSnakeCaseModels["PeriodicStateEventModel"]
): DatabaseModels["PeriodicStateEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toLastSwapData(data),
  ...toPeriodicStateMetadata(data),
  ...toPeriodicStateEventData(data),
});

export const toMarketRegistrationEventModel = (
  data: DatabaseSnakeCaseModels["MarketRegistrationEventModel"]
): DatabaseModels["MarketRegistrationEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toMarketRegistrationEventData(data),
});

export const toSwapEventModel = (
  data: DatabaseSnakeCaseModels["SwapEventModel"]
): DatabaseModels["SwapEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toLastSwapData(data),
  ...toSwapEventData(data),
  ...toStateEventData(data),
});

export const toChatEventModel = (
  data: DatabaseSnakeCaseModels["ChatEventModel"]
): DatabaseModels["ChatEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toChatEventData(data),
  ...toStateEventData(data),
});

export const toLiquidityEventModel = (
  data: DatabaseSnakeCaseModels["LiquidityEventModel"]
): DatabaseModels["LiquidityEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toLiquidityEventData(data),
  ...toStateEventData(data),
});

export const toMarketLatestStateEventModel = (
  data: DatabaseSnakeCaseModels["MarketLatestStateEventModel"]
): DatabaseModels["MarketLatestStateEventModel"] => ({
  ...toTransactionMetadata(data),
  ...toMarketAndStateMetadata(data),
  ...toStateEventData(data),
  dailyTvlPerLPCoinGrowthQ64: BigInt(data.daily_tvl_per_lp_coin_growth_q64),
  inBondingCurve: data.in_bonding_curve,
  volumeIn1MStateTracker: BigInt(data.volume_in_1m_state_tracker),
});

export const toUserLiquidityPoolsModel = (
  data: DatabaseSnakeCaseModels["UserLiquidityPoolsModel"]
): DatabaseModels["UserLiquidityPoolsModel"] => ({
  transactionVersion: BigInt(data.transaction_version),
  transactionTimestamp: data.transaction_timestamp,
  insertedAt: data.inserted_at,
  marketID: BigInt(data.market_id),
  symbolBytes: data.symbol_bytes,
  bumpTime: data.bump_time,
  marketNonce: BigInt(data.market_nonce),
  trigger: toTrigger(data.trigger),
  ...toLiquidityEventData(data),
});

export const toMarketDailyVolumeModel = (
  data: DatabaseSnakeCaseModels["MarketDailyVolumeModel"]
): DatabaseModels["MarketDailyVolumeModel"] => ({
  marketID: BigInt(data.market_id),
  dailyVolume: BigInt(data.daily_volume),
});

export const toMarket1MPeriodsInLastDay = (
  data: DatabaseSnakeCaseModels["Market1MPeriodsInLastDay"]
): DatabaseModels["Market1MPeriodsInLastDay"] => ({
  marketID: BigInt(data.market_id),
  transactionVersion: BigInt(data.transaction_version),
  insertedAt: data.inserted_at,
  nonce: BigInt(data.nonce),
  volume: BigInt(data.volume),
  startTime: data.start_time,
});
