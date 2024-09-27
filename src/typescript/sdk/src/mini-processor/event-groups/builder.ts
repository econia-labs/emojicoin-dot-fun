import { AccountAddress, type TransactionPayloadResponse } from "@aptos-labs/ts-sdk";
import {
  type AnyNumberString,
  isChatEvent,
  isLiquidityEvent,
  isMarketRegistrationEvent,
  isPeriodicStateEvent,
  isStateEvent,
  isSwapEvent,
  type Types,
} from "../../types";
import { type AccountAddressString } from "../../emojicoin_dot_fun/types";

export type TxnInfo = {
  version: bigint;
  sender: AccountAddressString;
  entryFunction: `0x${string}::${string}::${string}`;
  time: bigint;
};

export type BumpEvent =
  | Types.ChatEvent
  | Types.MarketRegistrationEvent
  | Types.LiquidityEvent
  | Types.SwapEvent;

export type EventWithMarket = BumpEvent | Types.StateEvent | Types.PeriodicStateEvent;

/// When a market is first registered, the market_nonce field emitted is always 1.
const INITIAL_MARKET_NONCE = 1n;

export const getMarketIDAndNonce = (
  event: EventWithMarket
): { marketID: bigint; marketNonce: bigint } => {
  const { marketID } = event;
  let marketNonce: bigint;
  if (isChatEvent(event)) {
    marketNonce = event.emitMarketNonce;
  } else if (isMarketRegistrationEvent(event)) {
    marketNonce = INITIAL_MARKET_NONCE;
  } else if (isSwapEvent(event) || isLiquidityEvent(event)) {
    marketNonce = event.marketNonce;
  } else if (isStateEvent(event)) {
    marketNonce = event.stateMetadata.marketNonce;
  } else if (isPeriodicStateEvent(event)) {
    marketNonce = event.periodicStateMetadata.emitMarketNonce;
  } else {
    throw new Error("Event is not an EventWithMarket.");
  }
  return {
    marketID,
    marketNonce,
  };
};

type EventGroup = {
  marketID: bigint;
  marketNonce: bigint;
  bumpEvent: BumpEvent;
  stateEvent: Types.StateEvent;
  periodicStateEvents: Types.PeriodicStateEvent[];
  txnInfo: TxnInfo;
};

export class EventGroupBuilder {
  public marketID: bigint;

  public marketNonce: bigint;

  public bumpEvent?: BumpEvent;

  public stateEvent?: Types.StateEvent;

  public periodicStateEvents: Types.PeriodicStateEvent[];

  public txnInfo: TxnInfo;

  private constructor(args: { event: EventWithMarket; txnInfo: TxnInfo }) {
    const { event, txnInfo } = args;
    const { marketID, marketNonce } = getMarketIDAndNonce(event);
    this.marketID = marketID;
    this.marketNonce = marketNonce;
    this.periodicStateEvents = [];
    this.txnInfo = txnInfo;
  }

  static fromEvent(event: EventWithMarket, txnInfo: TxnInfo): EventGroupBuilder {
    const builder = new EventGroupBuilder({
      event,
      txnInfo,
    });

    builder.addEvent(event);

    return builder;
  }

  addEvent(event: EventWithMarket) {
    const { marketID, marketNonce } = getMarketIDAndNonce(event);
    if (marketID !== this.marketID || marketNonce !== this.marketNonce) {
      throw new Error("EventGroupBuilder can only have one marketID and marketNonce.");
    }
    if (
      isChatEvent(event) ||
      isMarketRegistrationEvent(event) ||
      isSwapEvent(event) ||
      isLiquidityEvent(event)
    ) {
      this.addBump(event);
    } else if (isStateEvent(event)) {
      this.addState(event);
    } else if (isPeriodicStateEvent(event)) {
      this.addPeriodicState(event);
    }
  }

  addBump(event: BumpEvent) {
    if (this.bumpEvent) {
      throw new Error("EventGroups can only have one BumpEvent.");
    }
    this.bumpEvent = event;
  }

  addState(event: Types.StateEvent) {
    if (this.stateEvent) {
      throw new Error("EventGroups can only have one StateEvent.");
    }
    this.stateEvent = event;
  }

  addPeriodicState(event: Types.PeriodicStateEvent) {
    if (this.periodicStateEvents.length >= 7) {
      throw new Error("EventGroups can't have more than 7 PeriodicStateEvents.");
    }
    this.periodicStateEvents.push(event);
  }

  build(): EventGroup {
    if (!this.bumpEvent) {
      throw new Error("EventGroups must have a BumpEvent.");
    }
    if (!this.stateEvent) {
      throw new Error("EventGroups must have a StateEvent.");
    }

    return {
      marketID: this.marketID,
      marketNonce: this.marketNonce,
      bumpEvent: this.bumpEvent,
      stateEvent: this.stateEvent,
      periodicStateEvents: this.periodicStateEvents,
      txnInfo: this.txnInfo,
    };
  }
}

type ResponseTransactionInfo = {
  version: AnyNumberString;
  sender: string;
  payload: TransactionPayloadResponse;
  timestamp: AnyNumberString;
};

export const getTxnInfo = <T extends ResponseTransactionInfo>(response: T): TxnInfo => {
  const { version, sender, payload, timestamp } = response;
  if ("function" in payload) {
    return {
      version: BigInt(version),
      sender: AccountAddress.from(sender).toString(),
      entryFunction: payload.function as TxnInfo["entryFunction"],
      time: BigInt(timestamp),
    };
  }
  throw new Error("Can't create TxnInfo from a non-user transaction response/payload.");
};
