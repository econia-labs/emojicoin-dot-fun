/* eslint-disable import/no-unused-modules */
import {
  AccountAddress,
  type AccountAddressInput,
  TypeTag,
  type Uint128,
  type Uint64,
  type Uint8,
  parseTypeTag,
  Hex,
} from "@aptos-labs/ts-sdk";
import util from "util";
import {
  type CumulativeStats,
  type InstantaneousStats,
  type LastSwap,
  type MarketMetadata,
  type PeriodicStateMetadata,
  type Reserves,
  type StateMetadata,
  isMarketMetadata,
  toAggregatorSnapshot,
  toCumulativeStats,
  toInstantaneousStats,
  toLastSwap,
  toMarketMetadata,
  toPeriodicStateMetadata,
  toReserves,
  toStateMetadata,
} from "../types/contract";
import { type EventJSON } from "../types/core";

export function toTypeTag(
  addressInput: AccountAddressInput,
  moduleName: string,
  structName: string
): TypeTag {
  const address = AccountAddress.from(addressInput);
  return parseTypeTag(`${address.toString()}::${moduleName}::${structName}`);
}

export interface KnownEventInterface {
  MODULE_ADDRESS: AccountAddress;
  MODULE_NAME: string;
  STRUCT_NAME: string;
  STRUCT_STRING: string;
}

export function knownEventTypeTagString(e: KnownEventInterface): string {
  return toTypeTag(e.MODULE_ADDRESS, e.MODULE_NAME, e.STRUCT_NAME).toString();
}

// Initialized with keys: values at the bottom of this file.
const EventTypeFactoryMap: Map<string, (e: EventJSON) => KnownEventType> = new Map();

// AtLeastHasData is a type that ensures that the data field is present
// in the EventJSON object.
export type AtLeastHasData = Pick<EventJSON, "data"> & Partial<Omit<EventJSON, "data">>;

export function isKnownEventType(e: Event): e is KnownEventType {
  return (
    e instanceof SwapEvent ||
    e instanceof ChatEvent ||
    e instanceof MarketRegistrationEvent ||
    e instanceof PeriodicStateEvent ||
    e instanceof StateEvent ||
    e instanceof GlobalStateEvent ||
    e instanceof LiquidityEvent
  );
}

export type KnownEventType =
  | SwapEvent
  | ChatEvent
  | MarketRegistrationEvent
  | PeriodicStateEvent
  | StateEvent
  | GlobalStateEvent
  | LiquidityEvent;

export type AnyEventTpe = Event | KnownEventType;

export type Events = {
  swapEvents: SwapEvent[];
  chatEvents: ChatEvent[];
  marketRegistrationEvents: MarketRegistrationEvent[];
  periodicStateEvents: PeriodicStateEvent[];
  stateEvents: StateEvent[];
  globalStateEvents: GlobalStateEvent[];
  liquidityEvents: LiquidityEvent[];
  events: Event[];
};

/**
 * A general Event class to encapsulate any event emitted in a smart contract.
 * In order to parallelize events the GUID and sequence number are now filled
 * in with useless data, so we don't store those fields.
 */
export class Event {
  public readonly type: TypeTag;

  public readonly data: any;

  constructor(event: EventJSON) {
    this.type = parseTypeTag(event.type);
    this.data = event.data;
  }

  static from(event: EventJSON): Event | KnownEventType {
    if (EventTypeFactoryMap.has(event.type)) {
      const from = EventTypeFactoryMap.get(event.type)!;
      return from(event);
    }
    return new Event(event);
  }

  toJSON(): any {
    const d: Record<string, any> = {};
    Object.keys(this.data).forEach((field) => {
      const val = this.data[field as keyof typeof this.data];
      if (typeof val === "bigint") {
        d[field] = val < Number.MAX_SAFE_INTEGER ? Number(val) : val.toString();
      } else if (val instanceof AccountAddress) {
        d[field] = val.toString();
      } else if (val instanceof Uint8Array) {
        d[field] = Array.from(val);
      } else if (isMarketMetadata(val)) {
        d[field] = {
          marketId: val.marketId.toString(),
          emojiBytes: val.emojiBytes.toString(),
          marketAddress: val.marketAddress.toString(),
        };
      } else {
        d[field] = val;
      }
    });
    return d;
  }
}

const EMOJICOIN_DOT_FUN_MODULE_ADDRESS = AccountAddress.from(process.env.MODULE_ADDRESS!);
const EMOJICOIN_DOT_FUN_MODULE_NAME = process.env.EMOJICOIN_DOT_FUN_MODULE_NAME!;

export type SwapEventFields = {
  marketId: Uint64;
  time: Uint64;
  marketNonce: Uint64;
  swapper: AccountAddress;
  inputAmount: Uint64;
  isSell: boolean;
  integrator: AccountAddress;
  integratorFeeRateBps: Uint8;
  netProceeds: Uint64;
  baseVolume: Uint64;
  quoteVolume: Uint64;
  avgExecutionPriceQ64: Uint128;
  integratorFee: Uint64;
  poolFee: Uint64;
  startsInBondingCurve: boolean;
  resultsInStateTransition: boolean;
};

export class SwapEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "Swap";

  public static readonly STRUCT_STRING = knownEventTypeTagString(SwapEvent);

  public readonly data: SwapEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketId: BigInt(event.data.market_id),
      time: BigInt(event.data.time),
      marketNonce: BigInt(event.data.market_nonce),
      swapper: AccountAddress.from(event.data.swapper),
      inputAmount: BigInt(event.data.input_amount),
      isSell: event.data.is_sell,
      integrator: AccountAddress.from(event.data.integrator),
      integratorFeeRateBps: Number(event.data.integrator_fee_rate_bps),
      netProceeds: BigInt(event.data.net_proceeds),
      baseVolume: BigInt(event.data.base_volume),
      quoteVolume: BigInt(event.data.quote_volume),
      avgExecutionPriceQ64: BigInt(event.data.avg_execution_price_q64),
      integratorFee: BigInt(event.data.integrator_fee),
      poolFee: BigInt(event.data.pool_fee),
      startsInBondingCurve: event.data.starts_in_bonding_curve,
      resultsInStateTransition: event.data.results_in_state_transition,
    };
  }

  static from(event: AtLeastHasData): SwapEvent {
    if (event.type && event.type !== SwapEvent.STRUCT_STRING) {
      throw new Error(`Expected ${SwapEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new SwapEvent({
      type: SwapEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type ChatEventFields = {
  marketMetadata: MarketMetadata;
  emitTime: Uint64;
  emitMarketNonce: Uint64;
  user: AccountAddress;
  message: string;
  userEmojicoinBalance: Uint64;
  circulatingSupply: Uint64;
  balanceAsFractionOfCirculatingSupplyQ64: Uint128;
};

export class ChatEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "Chat";

  public static readonly STRUCT_STRING = knownEventTypeTagString(ChatEvent);

  public readonly data: ChatEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketMetadata: toMarketMetadata(event.data.market_metadata),
      emitTime: BigInt(event.data.emit_time),
      emitMarketNonce: BigInt(event.data.emit_market_nonce),
      user: AccountAddress.from(event.data.user),
      message: event.data.message,
      userEmojicoinBalance: BigInt(event.data.user_emojicoin_balance),
      circulatingSupply: BigInt(event.data.circulating_supply),
      balanceAsFractionOfCirculatingSupplyQ64: BigInt(
        event.data.balance_as_fraction_of_circulating_supply_q64
      ),
    };
  }

  static from(event: AtLeastHasData): ChatEvent {
    if (event.type && event.type !== ChatEvent.STRUCT_STRING) {
      throw new Error(`Expected ${ChatEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new ChatEvent({
      type: ChatEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type MarketRegistrationEventFields = {
  marketMetadata: MarketMetadata;
  time: Uint64;
  registrant: AccountAddress;
  integrator: AccountAddress;
  integratorFee: Uint64;
};

export class MarketRegistrationEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "MarketRegistration";

  public static readonly STRUCT_STRING = knownEventTypeTagString(MarketRegistrationEvent);

  public readonly data: MarketRegistrationEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketMetadata: toMarketMetadata(event.data.market_metadata),
      time: BigInt(event.data.time),
      registrant: AccountAddress.from(event.data.registrant),
      integrator: AccountAddress.from(event.data.integrator),
      integratorFee: BigInt(event.data.integrator_fee),
    };
  }

  static from(event: AtLeastHasData): MarketRegistrationEvent {
    if (event.type && event.type !== MarketRegistrationEvent.STRUCT_STRING) {
      throw new Error(`Expected ${MarketRegistrationEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new MarketRegistrationEvent({
      type: MarketRegistrationEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type PeriodicStateEventFields = {
  marketMetadata: MarketMetadata;
  periodicStateMetadata: PeriodicStateMetadata;
  openPriceQ64: Uint128;
  highPriceQ64: Uint128;
  lowPriceQ64: Uint128;
  closePriceQ64: Uint128;
  volumeBase: Uint128;
  volumeQuote: Uint128;
  integratorFees: Uint128;
  poolFeesBase: Uint128;
  poolFeesQuote: Uint128;
  nSwaps: Uint64;
  nChatMessages: Uint64;
  startsInBondingCurve: boolean;
  endsInBondingCurve: boolean;
  tvlPerLpCoinGrowthQ64: Uint128;
};

export class PeriodicStateEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "PeriodicState";

  public static readonly STRUCT_STRING = knownEventTypeTagString(PeriodicStateEvent);

  public readonly data: PeriodicStateEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketMetadata: toMarketMetadata(event.data.market_metadata),
      periodicStateMetadata: toPeriodicStateMetadata(event.data.periodic_state_metadata),
      openPriceQ64: BigInt(event.data.open_price_q64),
      highPriceQ64: BigInt(event.data.high_price_q64),
      lowPriceQ64: BigInt(event.data.low_price_q64),
      closePriceQ64: BigInt(event.data.close_price_q64),
      volumeBase: BigInt(event.data.volume_base),
      volumeQuote: BigInt(event.data.volume_quote),
      integratorFees: BigInt(event.data.integrator_fees),
      poolFeesBase: BigInt(event.data.pool_fees_base),
      poolFeesQuote: BigInt(event.data.pool_fees_quote),
      nSwaps: BigInt(event.data.n_swaps),
      nChatMessages: BigInt(event.data.n_chat_messages),
      startsInBondingCurve: event.data.starts_in_bonding_curve,
      endsInBondingCurve: event.data.ends_in_bonding_curve,
      tvlPerLpCoinGrowthQ64: BigInt(event.data.tvl_per_lp_coin_growth_q64),
    };
  }

  static from(event: AtLeastHasData): PeriodicStateEvent {
    if (event.type && event.type !== PeriodicStateEvent.STRUCT_STRING) {
      throw new Error(`Expected ${PeriodicStateEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new PeriodicStateEvent({
      type: PeriodicStateEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type StateEventFields = {
  marketMetadata: MarketMetadata;
  stateMetadata: StateMetadata;
  clammVirtualReserves: Reserves;
  cpammRealReserves: Reserves;
  lpCoinSupply: Uint128;
  cumulativeStats: CumulativeStats;
  instantaneousStats: InstantaneousStats;
  lastSwap: LastSwap;
};

export class StateEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "State";

  public static readonly STRUCT_STRING = knownEventTypeTagString(StateEvent);

  public readonly data: StateEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketMetadata: toMarketMetadata(event.data.market_metadata),
      stateMetadata: toStateMetadata(event.data.state_metadata),
      clammVirtualReserves: toReserves(event.data.clamm_virtual_reserves),
      cpammRealReserves: toReserves(event.data.cpamm_real_reserves),
      lpCoinSupply: event.data.lp_coin_supply,
      cumulativeStats: toCumulativeStats(event.data.cumulative_stats),
      instantaneousStats: toInstantaneousStats(event.data.instantaneous_stats),
      lastSwap: toLastSwap(event.data.last_swap),
    };
  }

  static from(event: AtLeastHasData): StateEvent {
    if (event.type && event.type !== StateEvent.STRUCT_STRING) {
      throw new Error(`Expected ${StateEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new StateEvent({
      type: StateEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type GlobalStateEventFields = {
  emitTime: Uint64;
  registryNonce: Uint64;
  trigger: Uint8;
  cumulativeQuoteVolume: Uint128; // AggregatorSnapshot<Uint128>
  totalQuoteLocked: Uint128; // AggregatorSnapshot<Uint128>
  totalValueLocked: Uint128; // AggregatorSnapshot<Uint128>
  marketCap: Uint128; // AggregatorSnapshot<Uint128>
  fullyDilutedValue: Uint128; // AggregatorSnapshot<Uint128>
  cumulativeIntegratorFees: Uint128; // AggregatorSnapshot<Uint128>
  cumulativeSwaps: Uint64; // AggregatorSnapshot<Uint64>
  cumulativeChatMessages: Uint64; // AggregatorSnapshot<Uint64>
};

export class GlobalStateEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "GlobalState";

  public static readonly STRUCT_STRING = knownEventTypeTagString(GlobalStateEvent);

  public readonly data: GlobalStateEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      emitTime: BigInt(event.data.emit_time),
      registryNonce: BigInt(event.data.registry_nonce),
      trigger: Number(event.data.trigger),
      cumulativeQuoteVolume: toAggregatorSnapshot(event.data.cumulative_quote_volume),
      totalQuoteLocked: toAggregatorSnapshot(event.data.total_quote_locked),
      totalValueLocked: toAggregatorSnapshot(event.data.total_value_locked),
      marketCap: toAggregatorSnapshot(event.data.market_cap),
      fullyDilutedValue: toAggregatorSnapshot(event.data.fully_diluted_value),
      cumulativeIntegratorFees: toAggregatorSnapshot(event.data.cumulative_integrator_fees),
      cumulativeSwaps: toAggregatorSnapshot(event.data.cumulative_swaps),
      cumulativeChatMessages: toAggregatorSnapshot(event.data.cumulative_chat_messages),
    };
  }

  static from(event: AtLeastHasData): GlobalStateEvent {
    if (event.type && event.type !== GlobalStateEvent.STRUCT_STRING) {
      throw new Error(`Expected ${GlobalStateEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new GlobalStateEvent({
      type: GlobalStateEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

export type LiquidityEventFields = {
  marketId: Uint64;
  time: Uint64;
  marketNonce: Uint64;
  provider: AccountAddress;
  baseAmount: Uint64;
  quoteAmount: Uint64;
  lpCoinAmount: Uint64;
  liquidityProvided: boolean;
  proRataBaseDonationClaimAmount: Uint64;
  proRataQuoteDonationClaimAmount: Uint64;
};

export class LiquidityEvent extends Event {
  public static readonly MODULE_ADDRESS = EMOJICOIN_DOT_FUN_MODULE_ADDRESS;

  public static readonly MODULE_NAME = EMOJICOIN_DOT_FUN_MODULE_NAME;

  public static readonly STRUCT_NAME = "Liquidity";

  public static readonly STRUCT_STRING = knownEventTypeTagString(LiquidityEvent);

  public readonly data: LiquidityEventFields;

  private constructor(event: EventJSON) {
    super(event);
    this.data = {
      marketId: BigInt(event.data.market_id),
      time: BigInt(event.data.time),
      marketNonce: BigInt(event.data.market_nonce),
      provider: AccountAddress.from(event.data.provider),
      baseAmount: BigInt(event.data.base_amount),
      quoteAmount: BigInt(event.data.quote_amount),
      lpCoinAmount: BigInt(event.data.lp_coin_amount),
      liquidityProvided: event.data.liquidity_provided,
      proRataBaseDonationClaimAmount: BigInt(event.data.pro_rata_base_donation_claim_amount),
      proRataQuoteDonationClaimAmount: BigInt(event.data.pro_rata_quote_donation_claim_amount),
    };
  }

  static from(event: AtLeastHasData): LiquidityEvent {
    if (event.type && event.type !== LiquidityEvent.STRUCT_STRING) {
      throw new Error(`Expected ${LiquidityEvent.STRUCT_STRING}, got ${event.type}`);
    }
    return new LiquidityEvent({
      type: LiquidityEvent.STRUCT_STRING,
      data: event.data,
    });
  }
}

// Set up the EventTypeFactoryMap.
[
  SwapEvent,
  ChatEvent,
  MarketRegistrationEvent,
  PeriodicStateEvent,
  StateEvent,
  GlobalStateEvent,
  LiquidityEvent,
].forEach((e) => EventTypeFactoryMap.set(knownEventTypeTagString(e), e.from));

// To pretty print Aptos SDK classes, we can update the object prototype's inspect method.
const updateInspect = (obj: any, styleType: util.Style): void => {
  Object.setPrototypeOf(obj.prototype, {
    [util.inspect.custom](_: number, options: util.InspectOptionsStylized): string {
      const newOptions = {
        ...options,
        depth: null,
        colors: true,
      };
      const stylized = newOptions.stylize(this.toString(), styleType);
      return `${obj.name} { ${stylized} }`;
    },
  });
};

updateInspect(AccountAddress, "undefined");
updateInspect(Hex, "special");
updateInspect(TypeTag, "date");
