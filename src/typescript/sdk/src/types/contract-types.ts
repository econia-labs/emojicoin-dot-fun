import { Hex } from "@aptos-labs/ts-sdk";
import { type AccountAddressString } from "../emojicoin_dot_fun/types";
import type JSONTypes from "./json-types";

export namespace ContractTypes {
  export type ExtendRef = {
    self: AccountAddressString;
  };

  export type SequenceInfo = {
    nonce: bigint;
    last_bump_time: bigint;
  };

  export type TVLtoLPCoinRatio = {
    tvl: bigint;
    lp_coins: bigint;
  };

  export type PeriodicStateTracker = {
    start_time: bigint;
    period: bigint;
    open_price_q64: bigint;
    high_price_q64: bigint;
    low_price_q64: bigint;
    close_price_q64: bigint;
    volume_base: bigint;
    volume_quote: bigint;
    integrator_fees: bigint;
    pool_fees_base: bigint;
    pool_fees_quote: bigint;
    n_swaps: bigint;
    n_chat_messages: bigint;
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
    last_bump_time: bigint;
    n_markets: bigint;
  };

  export type MarketView = {
    metadata: MarketMetadata;
    sequence_info: SequenceInfo;
    clamm_virtual_reserves: Reserves;
    cpamm_real_reserves: Reserves;
    lp_coin_supply: bigint;
    in_bonding_curve: boolean;
    cumulative_stats: CumulativeStats;
    instantaneous_stats: InstantaneousStats;
    last_swap: LastSwap;
    aptos_coin_balance: bigint;
    emojicoin_balance: bigint;
    emojicoin_lp_balance: bigint;
  };

  export type MarketResource = {
    metadata: MarketMetadata;
    sequence_info: SequenceInfo;
    extend_ref: ExtendRef;
    clamm_virtual_reserves: Reserves;
    cpamm_real_reserves: Reserves;
    lp_coin_supply: bigint;
    cumulative_stats: CumulativeStats;
    last_swap: LastSwap;
    periodic_state_trackers: PeriodicStateTracker;
  };

  export type MarketMetadata = {
    market_id: bigint;
    market_address: AccountAddressString;
    emoji_bytes: Uint8Array;
  };

  export type Reserves = {
    base: bigint;
    quote: bigint;
  };

  export type PeriodicStateMetadata = {
    start_time: bigint;
    period: bigint;
    emit_time: bigint;
    emit_market_nonce: bigint;
    trigger: number;
  };

  export type StateMetadata = {
    market_nonce: bigint;
    bump_time: bigint;
    trigger: number;
  };

  export type CumulativeStats = {
    base_volume: bigint;
    quote_volume: bigint;
    integrator_fees: bigint;
    pool_fees_base: bigint;
    pool_fees_quote: bigint;
    n_swaps: bigint;
    n_chat_messages: bigint;
  };

  export type InstantaneousStats = {
    total_quote_locked: bigint;
    total_value_locked: bigint;
    market_cap: bigint;
    fully_diluted_value: bigint;
  };

  export type LastSwap = {
    is_sell: boolean;
    avg_execution_price_q64: bigint;
    base_volume: bigint;
    quote_volume: bigint;
    nonce: bigint;
    time: bigint;
  };

  export type SwapEvent = {
    market_id: bigint;
    time: bigint;
    market_nonce: bigint;
    swapper: AccountAddressString;
    input_amount: bigint;
    is_sell: boolean;
    integrator: AccountAddressString;
    integrator_fee_rate_bps: number;
    net_proceeds: bigint;
    base_volume: bigint;
    quote_volume: bigint;
    avg_execution_price_q64: bigint;
    integrator_fee: bigint;
    pool_fee: bigint;
    starts_in_bonding_curve: boolean;
    results_in_state_transition: boolean;
  };

  export type ChatEvent = {
    market_metadata: MarketMetadata;
    emit_time: bigint;
    emit_market_nonce: bigint;
    user: AccountAddressString;
    message: string;
    user_emojicoin_balance: bigint;
    circulating_supply: bigint;
    balance_as_fraction_of_circulating_supply_q64: bigint;
  };

  export type MarketRegistrationEvent = {
    market_metadata: MarketMetadata;
    time: bigint;
    registrant: AccountAddressString;
    integrator: AccountAddressString;
    integrator_fee: bigint;
  };

  export type PeriodicStateMeta = {
    start_time: bigint;
    period: bigint;
    emit_time: bigint;
    emit_market_nonce: bigint;
    trigger: number;
  };

  export type PeriodicStateEvent = {
    market_metadata: MarketMetadata;
    periodic_state_metadata: PeriodicStateMetadata;
    open_price_q64: bigint;
    high_price_q64: bigint;
    low_price_q64: bigint;
    close_price_q64: bigint;
    volume_base: bigint;
    volume_quote: bigint;
    integrator_fees: bigint;
    pool_fees_base: bigint;
    pool_fees_quote: bigint;
    n_swaps: bigint;
    n_chat_messages: bigint;
    starts_in_bonding_curve: boolean;
    ends_in_bonding_curve: boolean;
    tvl_per_lp_coin_growth_q64: bigint;
  };

  export type StateEvent = {
    market_metadata: MarketMetadata;
    state_metadata: StateMetadata;
    clamm_virtual_reserves: Reserves;
    cpamm_real_reserves: Reserves;
    lp_coin_supply: bigint;
    cumulative_stats: CumulativeStats;
    instantaneous_stats: InstantaneousStats;
    last_swap: LastSwap;
  };

  export type GlobalStateEvent = {
    emit_time: bigint;
    trigger: number;
  };

  export type LiquidityEvent = {
    market_id: bigint;
    time: bigint;
    market_nonce: bigint;
    provider: AccountAddressString;
    base_amount: bigint;
    quote_amount: bigint;
    lp_coin_amount: bigint;
    liquidity_provided: boolean;
    pro_rata_base_donation_claim_amount: bigint;
    pro_rata_quote_donation_claim_amount: bigint;
  };
}
export const toExtendRef = (data: JSONTypes.ExtendRef): ContractTypes.ExtendRef => ({
  self: data.self,
});

export const toSequenceInfo = (data: JSONTypes.SequenceInfo): ContractTypes.SequenceInfo => ({
  nonce: BigInt(data.nonce),
  last_bump_time: BigInt(data.last_bump_time),
});

export const toTVLtoLPCoinRatio = (
  data: JSONTypes.TVLtoLPCoinRatio
): ContractTypes.TVLtoLPCoinRatio => ({
  tvl: BigInt(data.tvl),
  lp_coins: BigInt(data.lp_coins),
});

export const toReserves = (data: JSONTypes.Reserves): ContractTypes.Reserves => ({
  base: BigInt(data.base),
  quote: BigInt(data.quote),
});

export const toPeriodicStateTracker = (
  data: JSONTypes.PeriodicStateTracker
): ContractTypes.PeriodicStateTracker => ({
  start_time: BigInt(data.start_time),
  period: BigInt(data.period),
  open_price_q64: BigInt(data.open_price_q64),
  high_price_q64: BigInt(data.high_price_q64),
  low_price_q64: BigInt(data.low_price_q64),
  close_price_q64: BigInt(data.close_price_q64),
  volume_base: BigInt(data.volume_base),
  volume_quote: BigInt(data.volume_quote),
  integrator_fees: BigInt(data.integrator_fees),
  pool_fees_base: BigInt(data.pool_fees_base),
  pool_fees_quote: BigInt(data.pool_fees_quote),
  n_swaps: BigInt(data.n_swaps),
  n_chat_messages: BigInt(data.n_chat_messages),
  starts_in_bonding_curve: data.starts_in_bonding_curve,
  ends_in_bonding_curve: data.ends_in_bonding_curve,
  tvl_to_lp_coin_ratio_start: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_start),
  tvl_to_lp_coin_ratio_end: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_end),
});

export const toRegistryAddress = (
  data: JSONTypes.RegistryAddress
): ContractTypes.RegistryAddress => ({
  registry_address: data.registry_address,
});

export const toRegistryView = (data: JSONTypes.RegistryView): ContractTypes.RegistryView => ({
  registry_address: data.registry_address,
  last_bump_time: BigInt(data.last_bump_time),
  n_markets: BigInt(data.n_markets),
});

export const toMarketMetadata = (data: JSONTypes.MarketMetadata): ContractTypes.MarketMetadata => ({
  market_id: BigInt(data.market_id),
  market_address: data.market_address,
  emoji_bytes: Hex.fromHexInput(data.emoji_bytes).toUint8Array(),
});

export const toCumulativeStats = (
  data: JSONTypes.CumulativeStats
): ContractTypes.CumulativeStats => ({
  base_volume: BigInt(data.base_volume),
  quote_volume: BigInt(data.quote_volume),
  integrator_fees: BigInt(data.integrator_fees),
  pool_fees_base: BigInt(data.pool_fees_base),
  pool_fees_quote: BigInt(data.pool_fees_quote),
  n_swaps: BigInt(data.n_swaps),
  n_chat_messages: BigInt(data.n_chat_messages),
});

export const toInstantaneousStats = (
  data: JSONTypes.InstantaneousStats
): ContractTypes.InstantaneousStats => ({
  total_quote_locked: BigInt(data.total_quote_locked),
  total_value_locked: BigInt(data.total_value_locked),
  market_cap: BigInt(data.market_cap),
  fully_diluted_value: BigInt(data.fully_diluted_value),
});

export const toLastSwap = (data: JSONTypes.LastSwap): ContractTypes.LastSwap => ({
  is_sell: data.is_sell,
  avg_execution_price_q64: BigInt(data.avg_execution_price_q64),
  base_volume: BigInt(data.base_volume),
  quote_volume: BigInt(data.quote_volume),
  nonce: BigInt(data.nonce),
  time: BigInt(data.time),
});

export const toMarketView = (data: JSONTypes.MarketView): ContractTypes.MarketView => ({
  metadata: toMarketMetadata(data.metadata),
  sequence_info: toSequenceInfo(data.sequence_info),
  clamm_virtual_reserves: toReserves(data.clamm_virtual_reserves),
  cpamm_real_reserves: toReserves(data.cpamm_real_reserves),
  lp_coin_supply: BigInt(data.lp_coin_supply),
  in_bonding_curve: data.in_bonding_curve,
  cumulative_stats: toCumulativeStats(data.cumulative_stats),
  instantaneous_stats: toInstantaneousStats(data.instantaneous_stats),
  last_swap: toLastSwap(data.last_swap),
  aptos_coin_balance: BigInt(data.aptos_coin_balance),
  emojicoin_balance: BigInt(data.emojicoin_balance),
  emojicoin_lp_balance: BigInt(data.emojicoin_lp_balance),
});

export const toMarketResource = (data: JSONTypes.MarketResource): ContractTypes.MarketResource => ({
  metadata: toMarketMetadata(data.metadata),
  sequence_info: toSequenceInfo(data.sequence_info),
  extend_ref: toExtendRef(data.extend_ref),
  clamm_virtual_reserves: toReserves(data.clamm_virtual_reserves),
  cpamm_real_reserves: toReserves(data.cpamm_real_reserves),
  lp_coin_supply: BigInt(data.lp_coin_supply),
  cumulative_stats: toCumulativeStats(data.cumulative_stats),
  last_swap: toLastSwap(data.last_swap),
  periodic_state_trackers: toPeriodicStateTracker(data.periodic_state_trackers),
});

export const toPeriodicStateMetadata = (
  data: JSONTypes.PeriodicStateMetadata
): ContractTypes.PeriodicStateMetadata => ({
  start_time: BigInt(data.start_time),
  period: BigInt(data.period),
  emit_time: BigInt(data.emit_time),
  emit_market_nonce: BigInt(data.emit_market_nonce),
  trigger: Number(data.trigger),
});

export const toStateMetadata = (data: JSONTypes.StateMetadata): ContractTypes.StateMetadata => ({
  market_nonce: BigInt(data.market_nonce),
  bump_time: BigInt(data.bump_time),
  trigger: Number(data.trigger),
});

export const toSwapEvent = (data: JSONTypes.SwapEvent): ContractTypes.SwapEvent => ({
  market_id: BigInt(data.market_id),
  time: BigInt(data.time),
  market_nonce: BigInt(data.market_nonce),
  swapper: data.swapper,
  input_amount: BigInt(data.input_amount),
  is_sell: data.is_sell,
  integrator: data.integrator,
  integrator_fee_rate_bps: Number(data.integrator_fee_rate_bps),
  net_proceeds: BigInt(data.net_proceeds),
  base_volume: BigInt(data.base_volume),
  quote_volume: BigInt(data.quote_volume),
  avg_execution_price_q64: BigInt(data.avg_execution_price_q64),
  integrator_fee: BigInt(data.integrator_fee),
  pool_fee: BigInt(data.pool_fee),
  starts_in_bonding_curve: data.starts_in_bonding_curve,
  results_in_state_transition: data.results_in_state_transition,
});

export const toChatEvent = (data: JSONTypes.ChatEvent): ContractTypes.ChatEvent => ({
  market_metadata: toMarketMetadata(data.market_metadata),
  emit_time: BigInt(data.emit_time),
  emit_market_nonce: BigInt(data.emit_market_nonce),
  user: data.user,
  message: data.message,
  user_emojicoin_balance: BigInt(data.user_emojicoin_balance),
  circulating_supply: BigInt(data.circulating_supply),
  balance_as_fraction_of_circulating_supply_q64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
});

export const toMarketRegistrationEvent = (
  data: JSONTypes.MarketRegistrationEvent
): ContractTypes.MarketRegistrationEvent => ({
  market_metadata: toMarketMetadata(data.market_metadata),
  time: BigInt(data.time),
  registrant: data.registrant,
  integrator: data.integrator,
  integrator_fee: BigInt(data.integrator_fee),
});

export const toPeriodicStateMeta = (
  data: JSONTypes.PeriodicStateMeta
): ContractTypes.PeriodicStateMeta => ({
  start_time: BigInt(data.start_time),
  period: BigInt(data.period),
  emit_time: BigInt(data.emit_time),
  emit_market_nonce: BigInt(data.emit_market_nonce),
  trigger: Number(data.trigger),
});

export const toPeriodicStateEvent = (
  data: JSONTypes.PeriodicStateEvent
): ContractTypes.PeriodicStateEvent => ({
  market_metadata: toMarketMetadata(data.market_metadata),
  periodic_state_metadata: toPeriodicStateMetadata(data.periodic_state_metadata),
  open_price_q64: BigInt(data.open_price_q64),
  high_price_q64: BigInt(data.high_price_q64),
  low_price_q64: BigInt(data.low_price_q64),
  close_price_q64: BigInt(data.close_price_q64),
  volume_base: BigInt(data.volume_base),
  volume_quote: BigInt(data.volume_quote),
  integrator_fees: BigInt(data.integrator_fees),
  pool_fees_base: BigInt(data.pool_fees_base),
  pool_fees_quote: BigInt(data.pool_fees_quote),
  n_swaps: BigInt(data.n_swaps),
  n_chat_messages: BigInt(data.n_chat_messages),
  starts_in_bonding_curve: data.starts_in_bonding_curve,
  ends_in_bonding_curve: data.ends_in_bonding_curve,
  tvl_per_lp_coin_growth_q64: BigInt(data.tvl_per_lp_coin_growth_q64),
});

export const toStateEvent = (data: JSONTypes.StateEvent): ContractTypes.StateEvent => ({
  market_metadata: toMarketMetadata(data.market_metadata),
  state_metadata: toStateMetadata(data.state_metadata),
  clamm_virtual_reserves: toReserves(data.clamm_virtual_reserves),
  cpamm_real_reserves: toReserves(data.cpamm_real_reserves),
  lp_coin_supply: BigInt(data.lp_coin_supply),
  cumulative_stats: toCumulativeStats(data.cumulative_stats),
  instantaneous_stats: toInstantaneousStats(data.instantaneous_stats),
  last_swap: toLastSwap(data.last_swap),
});

export const toGlobalStateEvent = (
  data: JSONTypes.GlobalStateEvent
): ContractTypes.GlobalStateEvent => ({
  emit_time: BigInt(data.emit_time),
  trigger: Number(data.trigger),
});

export const toLiquidityEvent = (data: JSONTypes.LiquidityEvent): ContractTypes.LiquidityEvent => ({
  market_id: BigInt(data.market_id),
  time: BigInt(data.time),
  market_nonce: BigInt(data.market_nonce),
  provider: data.provider,
  base_amount: BigInt(data.base_amount),
  quote_amount: BigInt(data.quote_amount),
  lp_coin_amount: BigInt(data.lp_coin_amount),
  liquidity_provided: data.liquidity_provided,
  pro_rata_base_donation_claim_amount: BigInt(data.pro_rata_base_donation_claim_amount),
  pro_rata_quote_donation_claim_amount: BigInt(data.pro_rata_quote_donation_claim_amount),
});

export type AnyContractType =
  | ContractTypes.ExtendRef
  | ContractTypes.SequenceInfo
  | ContractTypes.TVLtoLPCoinRatio
  | ContractTypes.PeriodicStateTracker
  | ContractTypes.RegistryAddress
  | ContractTypes.RegistryView
  | ContractTypes.MarketView
  | ContractTypes.MarketResource
  | ContractTypes.MarketMetadata
  | ContractTypes.Reserves
  | ContractTypes.PeriodicStateMetadata
  | ContractTypes.StateMetadata
  | ContractTypes.CumulativeStats
  | ContractTypes.InstantaneousStats
  | ContractTypes.LastSwap
  | ContractTypes.SwapEvent
  | ContractTypes.ChatEvent
  | ContractTypes.MarketRegistrationEvent
  | ContractTypes.PeriodicStateMeta
  | ContractTypes.PeriodicStateEvent
  | ContractTypes.StateEvent
  | ContractTypes.GlobalStateEvent
  | ContractTypes.LiquidityEvent;

export type EventTypes =
  | ContractTypes.SwapEvent
  | ContractTypes.ChatEvent
  | ContractTypes.MarketRegistrationEvent
  | ContractTypes.PeriodicStateEvent
  | ContractTypes.StateEvent
  | ContractTypes.GlobalStateEvent
  | ContractTypes.LiquidityEvent;
