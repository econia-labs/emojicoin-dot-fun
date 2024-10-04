/* eslint-disable @typescript-eslint/no-explicit-any */
// cspell:word goldens
import {
  getEvents,
  type JsonTypes,
  MODULE_ADDRESS,
  toChatEvent,
  toGlobalStateEvent,
  toLiquidityEvent,
  toMarketRegistrationEvent,
  toPeriodicStateEvent,
  toStateEvent,
  toSwapEvent,
  typeTagInputToStructName,
} from "../../../src";
import {
  converter,
  isAnEmojicoinStructName,
  toCamelCaseEventName,
} from "../../../src/emojicoin_dot_fun/events";
import { type EventName } from "../../../src/indexer-v2/types";
import Data from "./event-data.json";
// Note that this isn't an actual valid transaction, it's just structured like one for parsing.
import Transaction from "./transaction.json";
import goldens from "./goldens";
import {
  type EntryFunctionPayloadResponse,
  type TransactionEd25519Signature,
  type TransactionResponseType,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";

type EventData = {
  [K in EventName]: JsonTypes[`${K}Event`];
};

// Must use `as any` here because the addresses aren't resolved with JSON type resolution as consts.
const eventData: EventData = Data as any;
const response: UserTransactionResponse = {
  ...Transaction,
  events: Transaction["events"].map((e) => {
    // Because the module address is interpolated at runtime for things like creating the contract's
    // struct tag strings and type tag strings and other various pattern matching functions, we must
    // interpolate the value into the json data at runtime lest the json data not accurately reflect
    // how an event would appear given the current `process.env.NEXT_PUBLIC_MODULE_ADDRESS`.
    return {
      ...e,
      type: e.type.replace(/^0x[a-fA-F0-9]*::/, `${MODULE_ADDRESS.toString()}::`),
    };
  }),
  signature: Transaction["signature"] as TransactionEd25519Signature,
  payload: Transaction["payload"] as EntryFunctionPayloadResponse,
  type: Transaction["type"] as TransactionResponseType.User,
};

const TRANSACTION_VERSION = 123987;

describe("tests for parsing event data", () => {
  it("parses global state event data", () => {
    const name: EventName = "GlobalState";
    const data = eventData[name];
    const manual = toGlobalStateEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses periodic state event data", () => {
    const name: EventName = "PeriodicState";
    const data = eventData[name];
    const manual = toPeriodicStateEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses market registration event data", () => {
    const name: EventName = "MarketRegistration";
    const data = eventData[name];
    const manual = toMarketRegistrationEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses swap event data", () => {
    const name: EventName = "Swap";
    const data = eventData[name];
    const manual = toSwapEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses chat event data", () => {
    const name: EventName = "Chat";
    const data = eventData[name];
    const manual = toChatEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses liquidity event data", () => {
    const name: EventName = "Liquidity";
    const data = eventData[name];
    const manual = toLiquidityEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses state event data", () => {
    const name: EventName = "State";
    const data = eventData[name];
    const manual = toStateEvent(data, TRANSACTION_VERSION);
    const fromConverter = converter[`${name}Event`](data, TRANSACTION_VERSION);
    expect(manual).toEqual(fromConverter);
    expect(manual).toEqual(goldens[name]);
  });
  it("parses events and slots them into the proper array", () => {
    const events = getEvents(response);

    response.events.forEach((event) => {
      const structName = typeTagInputToStructName(event.type)!;
      expect(structName).toBeDefined();
      expect(isAnEmojicoinStructName(structName)).toBe(true);
    });

    const eventNames = [
      "GlobalState",
      "PeriodicState",
      "MarketRegistration",
      "Swap",
      "Chat",
      "Liquidity",
      "State",
    ] as EventName[];

    for (const name of eventNames) {
      const data = eventData[name] as (typeof eventData)[typeof name];
      const fullName = `${name}Event` as const;
      const camelCaseName = toCamelCaseEventName(fullName);
      // TypeScript doesn't know the resolved type, so again, we must use `as any`.
      const fromConverter = converter[fullName](data as any, TRANSACTION_VERSION);
      expect(events[`${camelCaseName}s`].length).toEqual(1);
      const parsed = events[`${camelCaseName}s`].pop();
      expect(parsed).toEqual(fromConverter);
      expect(parsed).toEqual(goldens[name]);
    }
  });
});
