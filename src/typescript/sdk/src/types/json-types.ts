/* eslint-disable import/no-unused-modules */
import { type Uint8 } from "@aptos-labs/ts-sdk";
import {
  type Uint64String,
  type AccountAddressString,
  type Uint128String,
  type HexString,
} from "../emojicoin_dot_fun/types";
import { type EventJSON, type AggregatorSnapshot } from "./core";

namespace JSONTypes {
  // One row in the `inbox_latest_state` table.
  export type InboxLatestState = StateEvent & {
    transaction_version: number;
    marketID: number;
  };

  // Query return type for `market_data` view.
  export type MarketDataView = {
    market_id: number;
    market_address: `0x${string}`;
    market_cap: number;
    bump_time: number;
    transaction_version: number;
    n_swaps: number;
    n_chat_messages: number;
    clamm_virtual_reserves_base: Uint64String;
    clamm_virtual_reserves_quote: Uint64String;
    cpamm_real_reserves_base: Uint64String;
    cpamm_real_reserves_quote: Uint64String;
    lp_coin_supply: number;
    avg_execution_price_q64: number;
    emoji_bytes: `0x${string}`;
    all_time_volume: number;
    daily_volume: number;
    tvl_per_lp_coin_growth_q64: number;
  };

  export type ExtendRef = {
    self: AccountAddressString;
  };

  export type SequenceInfo = {
    nonce: Uint64String;
    last_bump_time: Uint64String;
  };

  export type TVLtoLPCoinRatio = {
    tvl: Uint128String;
    lp_coins: Uint128String;
  };

  export type PeriodicStateTracker = {
    start_time: Uint64String;
    period: Uint64String;
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
    tvl_to_lp_coin_ratio_start: TVLtoLPCoinRatio;
    tvl_to_lp_coin_ratio_end: TVLtoLPCoinRatio;
  };

  export type RegistryAddress = {
    registry_address: AccountAddressString;
  };

  export type RegistryView = {
    registry_address: AccountAddressString;
    nonce: AggregatorSnapshot<Uint64String>;
    last_bump_time: Uint64String;
    n_markets: Uint64String;
    cumulative_quote_volume: AggregatorSnapshot<Uint128String>;
    total_quote_locked: AggregatorSnapshot<Uint128String>;
    total_value_locked: AggregatorSnapshot<Uint128String>;
    market_cap: AggregatorSnapshot<Uint128String>;
    fully_diluted_value: AggregatorSnapshot<Uint128String>;
    cumulative_integrator_fees: AggregatorSnapshot<Uint128String>;
    cumulative_swaps: AggregatorSnapshot<Uint128String>;
    cumulative_chat_messages: AggregatorSnapshot<Uint128String>;
  };

  export type MarketView = {
    metadata: MarketMetadata;
    sequence_info: SequenceInfo;
    clamm_virtual_reserves_base: Uint64String;
    clamm_virtual_reserves_quote: Uint64String;
    cpamm_real_reserves_base: Uint64String;
    cpamm_real_reserves_quote: Uint64String;
    lp_coin_supply: Uint128String;
    in_bonding_curve: boolean;
    cumulative_stats: CumulativeStats;
    instantaneous_stats: InstantaneousStats;
    last_swap: LastSwap;
    periodic_state_trackers: PeriodicStateTracker[];
    aptos_coin_balance: Uint64String;
    emojicoin_balance: Uint64String;
    emojicoin_lp_balance: Uint64String;
  };

  export type MarketResource = {
    metadata: MarketMetadata;
    sequence_info: SequenceInfo;
    extend_ref: ExtendRef;
    clamm_virtual_reserves_base: Uint64String;
    clamm_virtual_reserves_quote: Uint64String;
    cpamm_real_reserves_base: Uint64String;
    cpamm_real_reserves_quote: Uint64String;
    lp_coin_supply: Uint128String;
    cumulative_stats: CumulativeStats;
    last_swap: LastSwap;
    periodic_state_trackers: Array<PeriodicStateTracker>;
  };

  export type MarketMetadata = {
    market_id: Uint64String;
    market_address: AccountAddressString;
    emoji_bytes: HexString;
  };

  export type Reserves = {
    base: Uint64String;
    quote: Uint64String;
  };

  export type PeriodicStateMetadata = {
    start_time: Uint64String;
    period: Uint64String;
    emit_time: Uint64String;
    emit_market_nonce: Uint64String;
    trigger: Uint8;
  };

  export type StateMetadata = {
    market_nonce: Uint64String;
    bump_time: Uint64String;
    trigger: Uint8;
  };
  export type CumulativeStats = {
    base_volume: Uint128String;
    quote_volume: Uint128String;
    integrator_fees: Uint128String;
    pool_fees_base: Uint128String;
    pool_fees_quote: Uint128String;
    n_swaps: Uint64String;
    n_chat_messages: Uint64String;
  };
  export type InstantaneousStats = {
    total_quote_locked: Uint64String;
    total_value_locked: Uint128String;
    market_cap: Uint128String;
    fully_diluted_value: Uint128String;
  };
  export type LastSwap = {
    is_sell: boolean;
    avg_execution_price_q64: Uint128String;
    base_volume: Uint64String;
    quote_volume: Uint64String;
    nonce: Uint64String;
    time: Uint64String;
  };

  export type SwapEvent = {
    market_id: Uint64String;
    time: Uint64String;
    market_nonce: Uint64String;
    swapper: AccountAddressString;
    input_amount: Uint64String;
    is_sell: boolean;
    integrator: AccountAddressString;
    integrator_fee_rate_bps: Uint8;
    net_proceeds: Uint64String;
    base_volume: Uint64String;
    quote_volume: Uint64String;
    avg_execution_price_q64: Uint128String;
    integrator_fee: Uint64String;
    pool_fee: Uint64String;
    starts_in_bonding_curve: boolean;
    results_in_state_transition: boolean;
  };

  export type ChatEvent = {
    market_metadata: MarketMetadata;
    emit_time: Uint64String;
    emit_market_nonce: Uint64String;
    user: AccountAddressString;
    message: string;
    user_emojicoin_balance: Uint64String;
    circulating_supply: Uint64String;
    balance_as_fraction_of_circulating_supply_q64: Uint128String;
  };

  export type MarketRegistrationEvent = {
    market_metadata: MarketMetadata;
    time: Uint64String;
    registrant: AccountAddressString;
    integrator: AccountAddressString;
    integrator_fee: Uint64String;
  };

  export type PeriodicStateEvent = {
    market_metadata: MarketMetadata;
    periodic_state_metadata: PeriodicStateMetadata;
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

  export type StateEvent = {
    market_metadata: MarketMetadata;
    state_metadata: StateMetadata;
    clamm_virtual_reserves: Reserves;
    cpamm_real_reserves: Reserves;
    lp_coin_supply: Uint128String;
    cumulative_stats: CumulativeStats;
    instantaneous_stats: InstantaneousStats;
    last_swap: LastSwap;
  };

  export type GlobalStateEvent = {
    emit_time: Uint64String;
    registry_nonce: AggregatorSnapshot<Uint64String>;
    trigger: Uint8;
    cumulative_quote_volume: AggregatorSnapshot<Uint128String>;
    total_quote_locked: AggregatorSnapshot<Uint128String>;
    total_value_locked: AggregatorSnapshot<Uint128String>;
    market_cap: AggregatorSnapshot<Uint128String>;
    fully_diluted_value: AggregatorSnapshot<Uint128String>;
    cumulative_integrator_fees: AggregatorSnapshot<Uint128String>;
    cumulative_swaps: AggregatorSnapshot<Uint64String>;
    cumulative_chat_messages: AggregatorSnapshot<Uint64String>;
  };

  export type LiquidityEvent = {
    market_id: Uint64String;
    time: Uint64String;
    market_nonce: Uint64String;
    provider: AccountAddressString;
    base_amount: Uint64String;
    quote_amount: Uint64String;
    lp_coin_amount: Uint64String;
    liquidity_provided: boolean;
    pro_rata_base_donation_claim_amount: Uint64String;
    pro_rata_quote_donation_claim_amount: Uint64String;
  };
}

export default JSONTypes;

export type AnyEmojicoinJSONEvent =
  | JSONTypes.SwapEvent
  | JSONTypes.ChatEvent
  | JSONTypes.MarketRegistrationEvent
  | JSONTypes.PeriodicStateEvent
  | JSONTypes.StateEvent
  | JSONTypes.GlobalStateEvent
  | JSONTypes.LiquidityEvent;

export function isJSONSwapEvent(e: EventJSON): boolean {
  return e.type.startsWith("Swap");
}
export function isJSONChatEvent(e: EventJSON): boolean {
  return e.type.startsWith("Chat");
}
export function isJSONMarketRegistrationEvent(e: EventJSON): boolean {
  return e.type.startsWith("MarketRegistration");
}
export function isJSONPeriodicStateEvent(e: EventJSON): boolean {
  return e.type.startsWith("PeriodicState");
}
export function isJSONStateEvent(e: EventJSON): boolean {
  return e.type.startsWith("State");
}
export function isJSONGlobalStateEvent(e: EventJSON): boolean {
  return e.type.startsWith("GlobalState");
}
export function isJSONLiquidityEvent(e: EventJSON): boolean {
  return e.type.startsWith("Liquidity");
}
