import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { toMarketEmojiData } from "../../emoji_data";
import {
  type AccountAddressString,
  deriveEmojicoinPublisherAddress,
  getEvents,
} from "../../emojicoin_dot_fun";
import {
  GuidGetters,
  type MarketMetadataModel,
  type StateEventData,
  type DatabaseModels,
  type TransactionMetadata,
} from "../../indexer-v2/types";
import {
  EventGroupBuilder,
  type EventWithMarket,
  getTxnInfo,
  getMarketIDAndNonce,
  type TxnInfo,
} from "./builder";
import { getMiscLatestStateEventFieldsFromWriteSet } from "../parse-write-set";

import { addModelsForBumpEvent, toPeriodicStateEventData } from "./utils";
import { type Events } from "../../emojicoin_dot_fun/events";

export type BumpEventModel =
  | DatabaseModels["chat_events"]
  | DatabaseModels["market_registration_events"]
  | DatabaseModels["swap_events"]
  | DatabaseModels["liquidity_events"];

export type EventsModels = {
  transaction: TxnInfo;
  chatEvents: Array<DatabaseModels["chat_events"]>;
  liquidityEvents: Array<DatabaseModels["liquidity_events"]>;
  marketRegistrationEvents: Array<DatabaseModels["market_registration_events"]>;
  periodicStateEvents: Array<DatabaseModels["periodic_state_events"]>;
  swapEvents: Array<DatabaseModels["swap_events"]>;
  userPools: Array<DatabaseModels["user_liquidity_pools"]>;
  marketLatestStateEvents: Array<DatabaseModels["market_latest_state_event"]>;
};

export type UserLiquidityPoolsMap = Map<
  [AccountAddressString, bigint],
  DatabaseModels["user_liquidity_pools"]
>;

/**
 * Parses the events passed in as processor models- aka the "mini processor" in this SDK.
 *
 * If no `response` is passed in, the data is assumed to be for fake data generation purposes, like
 * for animations. In that case a few fields are zeroed out and the lack of a `response` is ignored.
 *
 * @param events
 * @param txnInfo
 * @param response
 * @returns
 */
export function getEventsAsProcessorModels(
  events: Events,
  txnInfo: TxnInfo,
  response?: UserTransactionResponse
): EventsModels {
  const builders = new Map<string, EventGroupBuilder>();

  const marketEvents: EventWithMarket[] = [
    ...events.chatEvents,
    ...events.liquidityEvents,
    ...events.marketRegistrationEvents,
    ...events.periodicStateEvents,
    ...events.stateEvents,
    ...events.swapEvents,
  ];

  for (const event of marketEvents) {
    const { marketID, marketNonce } = getMarketIDAndNonce(event);
    const key = [marketID, marketNonce].toString();
    const builder = builders.get(key);

    if (builder) {
      builder.addEvent(event);
    } else {
      builders.set(key, EventGroupBuilder.fromEvent(event, txnInfo));
    }
  }

  // A user can interact with a liquidity multiple times in the same transaction, and since we
  // upsert only the latest interaction in the processor, we must only use the latest interaction
  // with a user liquidity pool.
  const userPools: UserLiquidityPoolsMap = new Map();

  // All the rows that the processor would insert into the database for this transaction.
  const rows = {
    transaction: txnInfo,
    chatEvents: new Array<DatabaseModels["chat_events"]>(),
    liquidityEvents: new Array<DatabaseModels["liquidity_events"]>(),
    marketRegistrationEvents: new Array<DatabaseModels["market_registration_events"]>(),
    periodicStateEvents: new Array<DatabaseModels["periodic_state_events"]>(),
    swapEvents: new Array<DatabaseModels["swap_events"]>(),
    userPools,
    marketLatestStateEvents: Array<DatabaseModels["market_latest_state_event"]>(),
  };

  for (const builder of builders.values()) {
    const { marketID, marketNonce, bumpEvent, stateEvent, periodicStateEvents } = builder.build();

    const transaction: TransactionMetadata = {
      ...txnInfo,
      timestamp: new Date(Number(txnInfo.time / 1000n)),
      // This is only for the database. Just insert a null-like value.
      insertedAt: new Date(0),
    };
    const { emojiBytes } = stateEvent.marketMetadata;
    const marketEmojiData = toMarketEmojiData(emojiBytes);
    const marketAddress = deriveEmojicoinPublisherAddress({
      emojis: marketEmojiData.emojis.map((e) => e.emoji),
    }).toString();
    const market: MarketMetadataModel = {
      marketID,
      time: txnInfo.time,
      marketNonce,
      trigger: stateEvent.stateMetadata.trigger,
      symbolEmojis: marketEmojiData.emojis.map((e) => e.emoji),
      marketAddress,
      ...marketEmojiData,
    };
    const state: StateEventData = {
      clammVirtualReserves: stateEvent.clammVirtualReserves,
      cpammRealReserves: stateEvent.cpammRealReserves,
      lpCoinSupply: stateEvent.lpCoinSupply,
      cumulativeStats: stateEvent.cumulativeStats,
      instantaneousStats: stateEvent.instantaneousStats,
    };

    const { lastSwap } = stateEvent;

    addModelsForBumpEvent({
      rows,
      transaction,
      market,
      state,
      lastSwap,
      event: bumpEvent,
      response,
    });

    // Create fake data if we're generating an event- otherwise, use the transaction response
    // passed in.
    const latestStateEventFromWriteSet = response
      ? {
          ...getMiscLatestStateEventFieldsFromWriteSet(response),
        }
      : {
          dailyTvlPerLPCoinGrowth: "0",
          inBondingCurve: true,
          volumeIn1MStateTracker: 0n,
        };

    // Convert the eventGroup data to the processor's `latest market state event` model.
    // Note we skip the check for the latest market resource, since we're only processing
    // a single transaction at a time instead of a batch of them (like the processor does).
    const marketLatestStateEvent: DatabaseModels["market_latest_state_event"] = {
      transaction,
      market,
      state,
      lastSwap,
      ...latestStateEventFromWriteSet,
      ...GuidGetters.marketLatestStateEvent(market),
    };
    rows.marketLatestStateEvents.push(marketLatestStateEvent);

    rows.periodicStateEvents.push(
      ...periodicStateEvents.map((periodicStateEvent) =>
        toPeriodicStateEventData({
          transaction,
          market,
          stateEvent,
          periodicStateEvent,
        })
      )
    );
  }

  return {
    ...rows,
    userPools: Array.from(rows.userPools.values()),
    transaction: txnInfo,
  };
}

export const getEventsAsProcessorModelsFromResponse = (
  response: UserTransactionResponse,
  events?: Events
) => {
  const txnInfo = getTxnInfo(response);
  return getEventsAsProcessorModels(events ?? getEvents(response), txnInfo, response);
};
