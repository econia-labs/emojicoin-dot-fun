import { toMarket1MPeriodsInLastDay } from ".";
import {
  AccountAddressString,
  HexString,
  Uint128String,
  Uint64String,
} from "../../emojicoin_dot_fun/types";
import { Flatten } from "../../types";

type PeriodType =
  | "period_1m"
  | "period_5m"
  | "period_15m"
  | "period_30m"
  | "period_1h"
  | "period_4h"
  | "period_1d";

type TriggerType =
  | "package_publication"
  | "market_registration"
  | "swap_buy"
  | "swap_sell"
  | "provide_liquidity"
  | "remove_liquidity"
  | "chat";

type TransactionMetadata = {
  transaction_version: Uint64String;
  sender: AccountAddressString;
  entry_function?: string | null;
  transaction_timestamp: Date;
  inserted_at: Date;
};

type MarketAndStateMetadata = {
  market_id: Uint64String;
  symbol_bytes: HexString;
  emit_time: Date;
  market_nonce: Uint64String;
  trigger: TriggerType;
};

type LastSwapData = {
  last_swap_is_sell: boolean;
  last_swap_avg_execution_price_q64: Uint128String;
  last_swap_base_volume: Uint64String;
  last_swap_quote_volume: Uint64String;
  last_swap_nonce: Uint64String;
  last_swap_time: Date;
};

type PeriodicStateMetadata = {
  period: PeriodType;
  start_time: Date;
};

type PeriodicStateEventData = {
  open_price_q64: Uint128String;
  high_price_q64: Uint128String;
  low_price_q64: Uint128String;
  close_price_q64: Uint128String;
  volume_base: Uint128String;
  volume_quote: Uint128String;
  integrator_fees: Uint128String;
  pool_fees_base: Uint128String;
  pool_fees_quote: Uint128String;
  n_swaps: Uint64String;
  n_chat_messages: Uint64String;
  starts_in_bonding_curve: boolean;
  ends_in_bonding_curve: boolean;
  tvl_per_lp_coin_growth_q64: Uint128String;
};

type MarketRegistrationEventData = {
  registrant: AccountAddressString;
  integrator: AccountAddressString;
  integrator_fee: Uint64String;
};

type SwapEventData = {
  swapper: AccountAddressString;
  integrator: AccountAddressString;
  integrator_fee: Uint64String;
  input_amount: Uint64String;
  is_sell: boolean;
  integrator_fee_rate_bps: number;
  net_proceeds: Uint64String;
  base_volume: Uint64String;
  quote_volume: Uint64String;
  avg_execution_price_q64: Uint128String;
  pool_fee: Uint64String;
  starts_in_bonding_curve: boolean;
  results_in_state_transition: boolean;
  balance_as_fraction_of_circulating_supply_before_q64: Uint128String;
  balance_as_fraction_of_circulating_supply_after_q64: Uint128String;
};

type LiquidityEventData = {
  provider: AccountAddressString;
  base_amount: Uint64String;
  quote_amount: Uint64String;
  lp_coin_amount: Uint64String;
  liquidity_provided: boolean;
  base_donation_claim_amount: Uint64String;
  quote_donation_claim_amount: Uint64String;
};

type ChatEventData = {
  user: AccountAddressString;
  message: string;
  user_emojicoin_balance: Uint64String;
  circulating_supply: Uint64String;
  balance_as_fraction_of_circulating_supply_q64: Uint128String;
};

type StateEventData = {
  clamm_virtual_reserves_base: Uint64String;
  clamm_virtual_reserves_quote: Uint64String;
  cpamm_real_reserves_base: Uint64String;
  cpamm_real_reserves_quote: Uint64String;
  lp_coin_supply: Uint128String;
  cumulative_stats_base_volume: Uint128String;
  cumulative_stats_quote_volume: Uint128String;
  cumulative_stats_integrator_fees: Uint128String;
  cumulative_stats_pool_fees_base: Uint128String;
  cumulative_stats_pool_fees_quote: Uint128String;
  cumulative_stats_n_swaps: Uint64String;
  cumulative_stats_n_chat_messages: Uint64String;
  instantaneous_stats_total_quote_locked: Uint64String;
  instantaneous_stats_total_value_locked: Uint128String;
  instantaneous_stats_market_cap: Uint128String;
  instantaneous_stats_fully_diluted_value: Uint128String;
};

type GlobalStateEventData = {
  emit_time: Date;
  registry_nonce: Uint64String;
  trigger: TriggerType;
  cumulative_quote_volume: Uint128String;
  total_quote_locked: Uint128String;
  total_value_locked: Uint128String;
  market_cap: Uint128String;
  fully_diluted_value: Uint128String;
  cumulative_integrator_fees: Uint128String;
  cumulative_swaps: Uint64String;
  cumulative_chat_messages: Uint64String;
};

export type DatabaseDataTypes = {
  TransactionMetadata: TransactionMetadata;
  MarketAndStateMetadata: MarketAndStateMetadata;
  LastSwapData: LastSwapData;
  PeriodicStateMetadata: PeriodicStateMetadata;
  PeriodicStateEventData: PeriodicStateEventData;
  MarketRegistrationEventData: MarketRegistrationEventData;
  SwapEventData: SwapEventData;
  LiquidityEventData: LiquidityEventData;
  ChatEventData: ChatEventData;
  StateEventData: StateEventData;
  GlobalStateEventData: GlobalStateEventData;
};

export type DatabaseSnakeCaseModels = {
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
        daily_tvl_per_lp_coin_growth_q64: Uint128String;
        in_bonding_curve: boolean;
        volume_in_1m_state_tracker: Uint128String;
      }
  >;
  UserLiquidityPoolsModel: Flatten<
    Omit<TransactionMetadata, "sender" | "entry_function"> &
      Omit<MarketAndStateMetadata, "emit_time"> & { bump_time: Date } & LiquidityEventData
  >;
  MarketDailyVolumeModel: {
    market_id: Uint64String;
    daily_volume: Uint128String;
  };
  Market1MPeriodsInLastDay: {
    market_id: Uint64String;
    transaction_version: Uint64String;
    inserted_at: Date;
    nonce: Uint64String;
    volume: Uint128String;
    start_time: Date;
  };
};
export type DatabaseSchemaTypes = {
  global_state_events: Array<DatabaseSnakeCaseModels["GlobalStateEventModel"]>;
  periodic_state_events: Array<DatabaseSnakeCaseModels["PeriodicStateEventModel"]>;
  market_registration_events: Array<DatabaseSnakeCaseModels["MarketRegistrationEventModel"]>;
  swap_events: Array<DatabaseSnakeCaseModels["SwapEventModel"]>;
  chat_events: Array<DatabaseSnakeCaseModels["ChatEventModel"]>;
  liquidity_events: Array<DatabaseSnakeCaseModels["LiquidityEventModel"]>;
  market_latest_state_event: Array<DatabaseSnakeCaseModels["MarketLatestStateEventModel"]>;
  user_liquidity_pools: Array<DatabaseSnakeCaseModels["UserLiquidityPoolsModel"]>;
  market_daily_volume: Array<DatabaseSnakeCaseModels["MarketDailyVolumeModel"]>;
  market_1m_periods_in_last_day: Array<DatabaseSnakeCaseModels["Market1MPeriodsInLastDay"]>;
};

// Technically some of these are views, but may as well be tables in the context of the indexer.
export enum TableNames {
  GlobalStateEvents = "global_state_events",
  PeriodicStateEvents = "periodic_state_events",
  MarketRegistrationEvents = "market_registration_events",
  SwapEvents = "swap_events",
  LiquidityEvents = "chat_events",
  ChatEvents = "liquidity_events",
  MarketLatestStateEvent = "market_latest_state_event",
  UserLiquidityPools = "user_liquidity_pools",
  MarketDailyVolume = "market_daily_volume",
  Market1MPeriodsInLastDay = "market_1m_periods_in_last_day",
}
