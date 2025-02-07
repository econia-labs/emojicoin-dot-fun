/* eslint-disable import/no-unused-modules */
import { AccountAddress, type Uint8 } from "@aptos-labs/ts-sdk";
import {
  type Uint64String,
  type AccountAddressString,
  type Uint128String,
  type HexString,
} from "../emojicoin_dot_fun/types";
import { type EventJSON, type AggregatorSnapshot } from "./core";
import { type ArenaJsonTypes } from "./arena-json-types";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
  | bigint;

type JsonTypes = ArenaJsonTypes & {
  ExtendRef: {
    self: AccountAddressString;
  };

  TableHandle: {
    handle: AccountAddressString;
  };

  SmartTable: {
    buckets: {
      inner: JsonTypes["TableHandle"];
      length: string;
    };
    level: string;
    num_buckets: string;
    size: string;
    split_load_threshold: number;
    target_bucket_size: string;
  };

  ParallelizableSequenceInfo: {
    nonce: AggregatorSnapshot<Uint64String>;
    last_bump_time: Uint64String;
  };

  SequenceInfo: {
    nonce: Uint64String;
    last_bump_time: Uint64String;
  };

  TVLtoLPCoinRatio: {
    tvl: Uint128String;
    lp_coins: Uint128String;
  };

  PeriodicStateTracker: {
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
    tvl_to_lp_coin_ratio_start: JsonTypes["TVLtoLPCoinRatio"];
    tvl_to_lp_coin_ratio_end: JsonTypes["TVLtoLPCoinRatio"];
  };

  RegistryAddress: {
    registry_address: AccountAddressString;
  };

  RegistryView: {
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
    cumulative_chat_messages: AggregatorSnapshot<Uint64String>;
  };

  // The result of the contract's `market_view` view function. NOT the database view.
  MarketView: {
    metadata: JsonTypes["MarketMetadata"];
    sequence_info: JsonTypes["SequenceInfo"];
    clamm_virtual_reserves: {
      base: Uint64String;
      quote: Uint64String;
    };
    cpamm_real_reserves: {
      base: Uint64String;
      quote: Uint64String;
    };
    lp_coin_supply: Uint128String;
    in_bonding_curve: boolean;
    cumulative_stats: JsonTypes["CumulativeStats"];
    instantaneous_stats: JsonTypes["InstantaneousStats"];
    last_swap: JsonTypes["LastSwap"];
    periodic_state_trackers: JsonTypes["PeriodicStateTracker"][];
    aptos_coin_balance: Uint64String;
    emojicoin_balance: Uint64String;
    emojicoin_lp_balance: Uint64String;
  };

  Market: {
    metadata: JsonTypes["MarketMetadata"];
    sequence_info: JsonTypes["SequenceInfo"];
    extend_ref: JsonTypes["ExtendRef"];
    clamm_virtual_reserves: JsonTypes["Reserves"];
    cpamm_real_reserves: JsonTypes["Reserves"];
    lp_coin_supply: Uint128String;
    cumulative_stats: JsonTypes["CumulativeStats"];
    last_swap: JsonTypes["LastSwap"];
    periodic_state_trackers: Array<JsonTypes["PeriodicStateTracker"]>;
  };

  Registry: {
    coin_symbol_emojis: JsonTypes["TableHandle"];
    extend_ref: JsonTypes["ExtendRef"];
    global_stats: {
      cumulative_quote_volume: AggregatorSnapshot<Uint128String>;
      total_quote_locked: AggregatorSnapshot<Uint128String>;
      total_value_locked: AggregatorSnapshot<Uint128String>;
      market_cap: AggregatorSnapshot<Uint128String>;
      fully_diluted_value: AggregatorSnapshot<Uint128String>;
      cumulative_integrator_fees: AggregatorSnapshot<Uint128String>;
      cumulative_swaps: AggregatorSnapshot<Uint64String>;
      cumulative_chat_messages: AggregatorSnapshot<Uint64String>;
    };
    markets_by_emoji_bytes: JsonTypes["SmartTable"];
    markets_by_market_id: JsonTypes["SmartTable"];
    registry_address: AccountAddressString;
    sequence_info: JsonTypes["ParallelizableSequenceInfo"];
    supplemental_chat_emojis: JsonTypes["TableHandle"];
  };

  MarketMetadata: {
    market_id: Uint64String;
    market_address: AccountAddressString;
    emoji_bytes: HexString;
  };

  Reserves: {
    base: Uint64String;
    quote: Uint64String;
  };

  PeriodicStateMetadata: {
    start_time: Uint64String;
    period: Uint64String;
    emit_time: Uint64String;
    emit_market_nonce: Uint64String;
    trigger: Uint8;
  };

  StateMetadata: {
    market_nonce: Uint64String;
    bump_time: Uint64String;
    trigger: Uint8;
  };
  CumulativeStats: {
    base_volume: Uint128String;
    quote_volume: Uint128String;
    integrator_fees: Uint128String;
    pool_fees_base: Uint128String;
    pool_fees_quote: Uint128String;
    n_swaps: Uint64String;
    n_chat_messages: Uint64String;
  };
  InstantaneousStats: {
    total_quote_locked: Uint64String;
    total_value_locked: Uint128String;
    market_cap: Uint128String;
    fully_diluted_value: Uint128String;
  };
  LastSwap: {
    is_sell: boolean;
    avg_execution_price_q64: Uint128String;
    base_volume: Uint64String;
    quote_volume: Uint64String;
    nonce: Uint64String;
    time: Uint64String;
  };

  SwapEvent: {
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
    balance_as_fraction_of_circulating_supply_before_q64: Uint128String;
    balance_as_fraction_of_circulating_supply_after_q64: Uint128String;
  };

  ChatEvent: {
    market_metadata: JsonTypes["MarketMetadata"];
    emit_time: Uint64String;
    emit_market_nonce: Uint64String;
    user: AccountAddressString;
    message: string;
    user_emojicoin_balance: Uint64String;
    circulating_supply: Uint64String;
    balance_as_fraction_of_circulating_supply_q64: Uint128String;
  };

  MarketRegistrationEvent: {
    market_metadata: JsonTypes["MarketMetadata"];
    time: Uint64String;
    registrant: AccountAddressString;
    integrator: AccountAddressString;
    integrator_fee: Uint64String;
  };

  PeriodicStateEvent: {
    market_metadata: JsonTypes["MarketMetadata"];
    periodic_state_metadata: JsonTypes["PeriodicStateMetadata"];
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

  StateEvent: {
    market_metadata: JsonTypes["MarketMetadata"];
    state_metadata: JsonTypes["StateMetadata"];
    clamm_virtual_reserves: JsonTypes["Reserves"];
    cpamm_real_reserves: JsonTypes["Reserves"];
    lp_coin_supply: Uint128String;
    cumulative_stats: JsonTypes["CumulativeStats"];
    instantaneous_stats: JsonTypes["InstantaneousStats"];
    last_swap: JsonTypes["LastSwap"];
  };

  GlobalStateEvent: {
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

  LiquidityEvent: {
    market_id: Uint64String;
    time: Uint64String;
    market_nonce: Uint64String;
    provider: AccountAddressString;
    base_amount: Uint64String;
    quote_amount: Uint64String;
    lp_coin_amount: Uint64String;
    liquidity_provided: boolean;
    base_donation_claim_amount: Uint64String;
    quote_donation_claim_amount: Uint64String;
  };

  RegistrantGracePeriodFlag: {
    market_registrant: AccountAddressString;
    market_registration_time: Uint64String;
  };

  EmojicoinDotFunRewards: {
    swap: JsonTypes["SwapEvent"];
    octas_reward_amount: Uint64String;
  };
};

export default JsonTypes;

export type AnyEmojicoinJSONEvent =
  | JsonTypes["SwapEvent"]
  | JsonTypes["ChatEvent"]
  | JsonTypes["MarketRegistrationEvent"]
  | JsonTypes["PeriodicStateEvent"]
  | JsonTypes["StateEvent"]
  | JsonTypes["GlobalStateEvent"]
  | JsonTypes["LiquidityEvent"];

export function isJSONSwapEvent(e: EventJSON): boolean {
  return e.type.endsWith("Swap");
}
export function isJSONChatEvent(e: EventJSON): boolean {
  return e.type.endsWith("Chat");
}
export function isJSONMarketRegistrationEvent(e: EventJSON): boolean {
  return e.type.endsWith("MarketRegistration");
}
export function isJSONPeriodicStateEvent(e: EventJSON): boolean {
  return e.type.endsWith("PeriodicState");
}
export function isJSONStateEvent(e: EventJSON): boolean {
  return e.type.endsWith("State");
}
export function isJSONGlobalStateEvent(e: EventJSON): boolean {
  return e.type.endsWith("GlobalState");
}
export function isJSONLiquidityEvent(e: EventJSON): boolean {
  return e.type.endsWith("Liquidity");
}
export function isRegistrantGracePeriodFlag(e: EventJSON["data"][number]) {
  return (
    "market_registrant" in e &&
    "market_registration_time" in e &&
    AccountAddress.isValid(e.market_registrant) &&
    !Number.isNaN(e.market_registration_time)
  );
}
