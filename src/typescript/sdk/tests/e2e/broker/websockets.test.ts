// cspell:word unsubscriptions

import type { TypeTag } from "@aptos-labs/ts-sdk";
import { AccountAddress } from "@aptos-labs/ts-sdk";

import { Chat, ProvideLiquidity, RegisterMarket, Swap, SwapWithRewards } from "@/move-modules";

import type { BrokerEventModels, MarketEmojiData, SymbolEmoji, Types } from "../../../src";
import {
  calculateCurvePrice,
  compareBigInt,
  encodeEmojis,
  enumerate,
  getEmojicoinMarketAddressAndTypeTags,
  getEvents,
  isNonArenaCandlestickModel,
  maxBigInt,
  ONE_APT,
  ONE_APT_BIGINT,
  Period,
  periodToPeriodTypeFromBroker,
  sleep,
  SYMBOL_EMOJI_DATA,
  toMarketEmojiData,
  zip,
} from "../../../src";
import {
  convertWebSocketMessageToBrokerEvent,
  WebSocketClient,
} from "../../../src/broker-v2/client";
import type { BrokerEvent } from "../../../src/broker-v2/types";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { stringifyJSONWithBigInts } from "../../../src/indexer-v2";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries";
import {
  isChatEventModel,
  isMarketLatestStateEventModel,
  isMarketRegistrationEventModel,
  isSwapEventModel,
  isTransactionEventModel,
} from "../../../src/indexer-v2/types";
import { EXACT_TRANSITION_INPUT_AMOUNT, getAptosClient } from "../../utils";
import { getFundedAccounts } from "../../utils/test-accounts";
import {
  BROKER_URL,
  compareParsedData,
  connectNewClient,
  customWaitFor,
  subscribe,
  waitForClientToConnect,
} from "./utils";

jest.setTimeout(20000);

describe("tests to ensure that websocket event subscriptions work as expected", () => {
  const registrants = getFundedAccounts("040", "041", "042", "043", "044", "045", "095", "096");
  const aptos = getAptosClient();
  const senderArgs = Array.from(registrants).map((acc) => ({
    registrant: acc,
    provider: acc,
    user: acc,
    swapper: acc,
    aptosConfig: aptos.config,
    integrator: acc.accountAddress,
  }));
  const marketsRegistered: Types["MarketRegistrationEvent"][] = [];

  const sharedSwapArgs = {
    isSell: false,
    inputAmount: 100n,
    minOutputAmount: 1n,
  };

  const sharedChatArgs = {
    emojiBytes: [SYMBOL_EMOJI_DATA.byEmojiStrict("⚔️").bytes],
    emojiIndicesSequence: new Uint8Array([0]),
  };

  const marketData: MarketEmojiData[] = (
    [
      ["🍌"],
      ["🍟"],
      ["🍺"],
      ["🍦"],
      ["🍌", "🍟"],
      ["🍉", "🍉"],
      ["🍺", "🍺"],
      ["🍌", "🍌"],
    ] as Array<SymbolEmoji[]>
  )
    .map(encodeEmojis)
    .map(toMarketEmojiData);

  const marketMetadata = marketData.map((mkt) =>
    getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: mkt.symbolData.bytes,
    })
  );

  beforeAll(async () => {
    expect(marketData.length).toEqual(registrants.length);
    // Register a market for use in the following tests.
    const registrationsOutOfOrder = await Promise.all(
      zip(senderArgs, marketData).map(async ([args, market], originalIndex) => {
        return RegisterMarket.submit({
          ...args,
          emojis: market.emojis.map((e) => e.bytes),
          options: {
            maxGasAmount: (ONE_APT / 100) * 2,
            gasUnitPrice: 100,
          },
        }).then((res) => {
          expect(res.success).toBe(true);
          const events = getEvents(res);
          expect(events.marketRegistrationEvents.length).toEqual(1);
          const event = events.marketRegistrationEvents.pop()!;
          expect(event).toBeDefined();
          return {
            event,
            originalIndex,
          };
        });
      })
    );
    const inOrder = registrationsOutOfOrder.sort(({ originalIndex: a }, { originalIndex: b }) =>
      compareBigInt(a, b)
    );
    inOrder.forEach(({ event }) => marketsRegistered.push(event));
    const highestVersion = maxBigInt(...marketsRegistered.map((r) => BigInt(r.version)));
    await waitForEmojicoinIndexer(highestVersion, 10000);
    // Ensure the broker has emitted all previous events by waiting a couple seconds.
    await sleep(2000);
    return true;
  });

  it("establishes a fresh client connection to the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    expect(client.readyState).toEqual(client.OPEN);
    expect(events.length).toEqual(0);
    expect(messageEvents.length).toEqual(0);
    expect(brokerMessages.length).toEqual(0);
  });

  it("receives an event within two seconds of the event being submitted", async () => {
    const { client, messageEvents } = await connectNewClient();
    const MARKET_INDEX = 0;

    subscribe(client, [], ["Swap"]);
    const { marketAddress, emojicoin, emojicoinLP } = marketMetadata[MARKET_INDEX];

    const response = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...sharedSwapArgs,
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
    });

    await customWaitFor(() => messageEvents.length === 1);
    const messageEvent = messageEvents.pop()!;
    expect(messageEvent).toBeDefined();
    const event = convertWebSocketMessageToBrokerEvent(messageEvent);

    const isTransactionEvent = isTransactionEventModel(event);
    expect(isTransactionEvent).toBe(true);
    if (!isTransactionEvent) throw new Error("Never.");

    expect(event.transaction.version).toEqual(BigInt(response.version));
    const received = BigInt(response.timestamp);
    expect(received - event.transaction.time).toBeLessThanOrEqual(2n * 1000n * 1000n);
  });

  it("subscribes to swaps type and receives a swap event from the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const eventName: BrokerEvent = "Swap";
    const MARKET_INDEX = 0;

    subscribe(client, [], [eventName]);

    const { marketAddress, emojicoin, emojicoinLP } = marketMetadata[MARKET_INDEX];

    const response = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...sharedSwapArgs,
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
    });

    await customWaitFor(() => messageEvents.length === 1);
    compareParsedData({
      messageEvent: messageEvents.pop(),
      brokerMessage: brokerMessages.pop(),
      event: events.pop(),
      eventName,
      response,
    });
  });

  it("subscribes to chats type and receives a chat event from the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const eventName: BrokerEvent = "Chat";
    const MARKET_INDEX = 1;

    subscribe(client, [], [eventName]);
    const { marketAddress, emojicoin, emojicoinLP } = marketMetadata[MARKET_INDEX];

    const response = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      ...sharedChatArgs,
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
    });

    await customWaitFor(() => messageEvents.length === 1);
    compareParsedData({
      messageEvent: messageEvents.pop(),
      brokerMessage: brokerMessages.pop(),
      event: events.pop(),
      eventName,
      response,
    });
  });

  it("receives chat and liquidity events from the broker", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const MARKET_INDEX = 2;
    subscribe(client, [], ["Swap", "Liquidity"]);
    const { marketAddress, emojicoin, emojicoinLP } = marketMetadata[MARKET_INDEX];

    const moreSharedArgs = {
      marketAddress,
      typeTags: [emojicoin, emojicoinLP] as [TypeTag, TypeTag],
    };

    const swapResponse = await Swap.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgs,
      isSell: false,
      inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
      minOutputAmount: 1n,
      integratorFeeRateBPs: 0,
    });

    const liquidityResponse = await ProvideLiquidity.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgs,
      quoteAmount: 1000n,
      minLpCoinsOut: 1n,
    });

    await customWaitFor(() => messageEvents.length === 2);
    // Since they're pushed at the same time, we only have to find the index of one, then we know
    // all the arrays should have the same index for the corresponding message event type.
    const swapIndex = events.findIndex(
      (e) => isTransactionEventModel(e) && e.transaction.version === BigInt(swapResponse.version)
    );
    const liquidityIndex = events.findIndex(
      (e) =>
        isTransactionEventModel(e) && e.transaction.version === BigInt(liquidityResponse.version)
    );
    compareParsedData({
      messageEvent: messageEvents[swapIndex],
      brokerMessage: brokerMessages[swapIndex],
      event: events[swapIndex],
      eventName: "Swap",
      response: swapResponse,
    });
    compareParsedData({
      messageEvent: messageEvents[liquidityIndex],
      brokerMessage: brokerMessages[liquidityIndex],
      event: events[liquidityIndex],
      eventName: "Liquidity",
      response: liquidityResponse,
    });
  });

  it("does not receive an event for an event type it is not subscribed to", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const MARKET_INDEX = 3;
    subscribe(client, [], ["Chat"]);
    const { marketAddress, emojicoin, emojicoinLP } = marketMetadata[MARKET_INDEX];

    const moreSharedArgs = {
      marketAddress,
      typeTags: [emojicoin, emojicoinLP] as [TypeTag, TypeTag],
    };

    const swapResponse = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgs,
      ...sharedSwapArgs,
    });

    const chatResponse = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
      ...sharedChatArgs,
    });

    const chatResponse2 = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      marketAddress,
      typeTags: [emojicoin, emojicoinLP],
      ...sharedChatArgs,
    });
    const highestVersion = maxBigInt(
      ...[swapResponse, chatResponse, chatResponse2].map(({ version }) => BigInt(version))
    );
    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(highestVersion);
    // Then wait for the broker to send at least two messages (it should be two chats).
    await customWaitFor(() => messageEvents.length >= 2);
    expect(messageEvents.length === 2);
    expect(brokerMessages.length === 2);
    expect(events.length === 2);
    expect(events.every((e) => e.eventName === "Chat")).toBe(true);

    for (const [event, i] of enumerate(events.filter(isTransactionEventModel))) {
      // Although the event arrays should correspond to one another's order, the responses may not.
      const response = [chatResponse, chatResponse2].find(
        ({ version }) => BigInt(version) === event.transaction.version
      );
      expect(response).toBeDefined();
      if (!response) throw new Error(`Couldn't find a matching response for ${event.guid}`);

      compareParsedData({
        messageEvent: messageEvents[i],
        brokerMessage: brokerMessages[i],
        event,
        eventName: "Chat",
        response,
      });
    }
  });

  it("receives events for only one market with specific event types", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const MARKET_INDEX = 4;

    const market_1 = marketsRegistered[MARKET_INDEX];
    const market_2 = await RegisterMarket.submit({
      ...senderArgs[MARKET_INDEX],
      emojis: toMarketEmojiData(encodeEmojis(["⚓"])).emojis.map((emoji) => emoji.bytes),
    }).then((res) => getEvents(res).marketRegistrationEvents.pop()!);
    expect(market_1).toBeDefined();
    expect(market_2).toBeDefined();
    expect(market_1).not.toEqual(market_2);

    subscribe(client, [market_1.marketID], ["Swap", "Chat"]);

    const marketMetadata_1 = marketMetadata.find((market) =>
      market.marketAddress.equals(AccountAddress.from(market_1.marketMetadata.marketAddress))
    )!;
    const marketMetadata_2 = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: market_2.marketMetadata.emojiBytes,
    });
    expect(marketMetadata_1).toBeDefined();
    expect(marketMetadata_1.marketAddress.toString()).not.toEqual(
      marketMetadata_2.marketAddress.toString()
    );

    const moreSharedArgsForMarket_1 = {
      marketAddress: marketMetadata_1.marketAddress,
      typeTags: [marketMetadata_1.emojicoin, marketMetadata_1.emojicoinLP] as [TypeTag, TypeTag],
    };

    const moreSharedArgsForMarket_2 = {
      marketAddress: marketMetadata_2.marketAddress,
      typeTags: [marketMetadata_2.emojicoin, marketMetadata_2.emojicoinLP] as [TypeTag, TypeTag],
    };

    const swap_1 = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_1,
      ...sharedSwapArgs,
    });

    const chat_1 = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_1,
      ...sharedChatArgs,
    });
    const swap_2 = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_2,
      ...sharedSwapArgs,
    });

    const chat_2 = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_2,
      ...sharedChatArgs,
    });

    const highestVersion = maxBigInt(
      ...[swap_1, swap_2, chat_1, chat_2].map(({ version }) => BigInt(version))
    );
    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(highestVersion);
    // Then wait for the broker to send at least two messages (it should be two chats).
    await customWaitFor(() => messageEvents.length >= 2);
    expect(messageEvents.length === 2);
    expect(brokerMessages.length === 2);
    expect(events.length === 2);
    events.forEach((brokerEvent) => {
      const validEvent = isSwapEventModel(brokerEvent) || isChatEventModel(brokerEvent);
      expect(validEvent).toBe(true);
      if (!validEvent) throw new Error("Never");
      expect(brokerEvent.market.marketAddress).toEqual(market_1.marketMetadata.marketAddress);
      expect(brokerEvent.market.symbolData.bytes).toEqual(market_1.marketMetadata.emojiBytes);
      expect(
        [swap_1, chat_1].map((r) => BigInt(r.version)).includes(brokerEvent.transaction.version)
      ).toBe(true);
    });
  });

  it("receives events for all markets and event types", async () => {
    const { client, events, messageEvents, brokerMessages } = await connectNewClient();
    const MARKET_INDEX = 5;

    // Don't subscribe to PeriodicStateEvents, or the test will possibly fail.
    // It's unreliable knowing whether or not one will be emitted, since it depends on when the
    // first market is registered in relation to 1-minute period boundaries.
    subscribe(client, [], ["MarketRegistration", "MarketLatestState", "Swap", "Chat"]);

    const market_1 = marketsRegistered[MARKET_INDEX];
    const registerResponse = await RegisterMarket.submit({
      ...senderArgs[MARKET_INDEX],
      emojis: toMarketEmojiData(encodeEmojis(["⚓⚓"])).emojis.map((emoji) => emoji.bytes),
    });
    const registerEvents = getEvents(registerResponse);
    const [market_2, registrationStateEventForMarket_2] = [
      registerEvents.marketRegistrationEvents.pop()!,
      registerEvents.stateEvents.pop()!,
    ];
    expect(market_1).toBeDefined();
    expect(market_2).toBeDefined();
    expect(registrationStateEventForMarket_2).toBeDefined();
    expect(market_1).not.toEqual(market_2);

    const marketMetadata_1 = marketMetadata.find((market) =>
      market.marketAddress.equals(AccountAddress.from(market_1.marketMetadata.marketAddress))
    )!;
    const marketMetadata_2 = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: market_2.marketMetadata.emojiBytes,
    });
    expect(marketMetadata_1).toBeDefined();
    expect(marketMetadata_1.marketAddress.toString()).not.toEqual(
      marketMetadata_2.marketAddress.toString()
    );

    const moreSharedArgsForMarket_1 = {
      marketAddress: marketMetadata_1.marketAddress,
      typeTags: [marketMetadata_1.emojicoin, marketMetadata_1.emojicoinLP] as [TypeTag, TypeTag],
    };

    const moreSharedArgsForMarket_2 = {
      marketAddress: marketMetadata_2.marketAddress,
      typeTags: [marketMetadata_2.emojicoin, marketMetadata_2.emojicoinLP] as [TypeTag, TypeTag],
    };

    const swaps = new Array<Types["SwapEvent"]>();
    const chats = new Array<Types["ChatEvent"]>();
    const states = new Array<Types["StateEvent"]>();

    const swap_1 = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_1,
      ...sharedSwapArgs,
    });
    const chat_1 = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_1,
      ...sharedChatArgs,
    });
    const swap_2 = await SwapWithRewards.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_2,
      ...sharedSwapArgs,
    });
    const chat_2 = await Chat.submit({
      ...senderArgs[MARKET_INDEX],
      ...moreSharedArgsForMarket_2,
      ...sharedChatArgs,
    });
    const eventsSwap_1 = getEvents(swap_1);
    const eventsSwap_2 = getEvents(swap_2);
    const eventsChat_1 = getEvents(chat_1);
    const eventsChat_2 = getEvents(chat_2);
    swaps.push(...eventsSwap_1.swapEvents, ...eventsSwap_2.swapEvents);
    chats.push(...eventsChat_1.chatEvents, ...eventsChat_2.chatEvents);
    states.push(
      ...eventsSwap_1.stateEvents,
      ...eventsChat_1.stateEvents,
      ...eventsSwap_2.stateEvents,
      ...eventsChat_2.stateEvents,
      registrationStateEventForMarket_2
    );
    expect(swaps.length).toBe(2);
    expect(chats.length).toBe(2);
    expect(states.length).toBe(5);
    expect(new Set(swaps.map((e) => e.guid)).size).toEqual(2);
    expect(new Set(chats.map((e) => e.guid)).size).toEqual(2);
    expect(new Set(states.map((e) => e.guid)).size).toEqual(5);
    expect(
      [...swaps, ...chats, ...states].every((swap) =>
        [market_1, market_2]
          .map(({ marketMetadata }) => marketMetadata.marketID)
          .includes(swap.marketID)
      )
    ).toBe(true);

    const highestVersion = maxBigInt(
      ...[...swaps, ...chats, ...states].map(({ version }) => BigInt(version))
    );
    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(highestVersion);
    // Wait for the broker to send all 10 messages:
    // 1 registration, 2 swaps, 2 chats, and 5 state event models.
    await customWaitFor(
      () => messageEvents.length === 10,
      () =>
        stringifyJSONWithBigInts(
          events.map((v) => ({
            event: v.eventName,
            txn: isTransactionEventModel(v) ? v.transaction.version : v.version,
            guid: v.guid,
          }))
        )
    );
    expect(messageEvents.length === 10);
    expect(brokerMessages.length === 10);
    expect(events.length === 10);
    events.forEach((brokerEvent) => {
      const isValidEvent =
        isSwapEventModel(brokerEvent) ||
        isChatEventModel(brokerEvent) ||
        isMarketLatestStateEventModel(brokerEvent) ||
        isMarketRegistrationEventModel(brokerEvent);
      expect(isValidEvent).toBe(true);
      if (!isValidEvent) throw new Error("Never");
      expect(
        [market_1, market_2]
          .map(({ marketMetadata }) => marketMetadata.marketID)
          .includes(brokerEvent.market.marketID)
      ).toBe(true);
      expect(
        [market_1, market_2]
          .map(({ marketMetadata }) => marketMetadata.emojiBytes.join(","))
          .includes(brokerEvent.market.symbolData.bytes.join(","))
      ).toBe(true);
    });
  });

  // NOTE: This test does not verify candlestick correctness, as that's mostly done in the arena
  // candlesticks test. This is meant to test the subscription to candlesticks by the WebSocket
  // client class.
  it("ensures the WebSocketClient works as expected with granular subscriptions", async () => {
    const MARKET_INDICES = [6, 7];
    const emojicoin = new EmojicoinClient();
    const { symbolEmojis: symbol1 } = marketData[MARKET_INDICES[0]];
    const { symbolEmojis: symbol2 } = marketData[MARKET_INDICES[1]];
    const { marketID: marketID1 } = marketsRegistered[MARKET_INDICES[0]];
    const { marketID: marketID2 } = marketsRegistered[MARKET_INDICES[1]];
    const sender1 = registrants[MARKET_INDICES[0]];
    const sender2 = registrants[MARKET_INDICES[1]];

    // Set up the client to use the WebSocketClient.
    expect(BROKER_URL).toBeDefined();
    const events: BrokerEventModels[] = [];

    let testIsFinished = false;

    const client = new WebSocketClient({
      url: BROKER_URL,
      listeners: {
        onMessage: (e) => {
          events.push(e);
        },
        onClose: (e) => {
          if (!testIsFinished) throw new Error(e.reason);
        },
        onError: (e) => {
          throw new Error(e.type);
        },
      },
    });

    // Wait it for it to fully connect.
    await waitForClientToConnect(client.client);

    expect(client.subscriptions.arena).toBe(false);
    expect(client.subscriptions.arenaPeriods.size).toBe(0);
    expect(client.subscriptions.marketPeriods.size).toBe(0);
    expect(client.subscriptions.marketIDs).toEqual(new Set([]));
    expect(Array.from(client.subscriptions.marketPeriods.keys())).toHaveLength(0);

    const p = periodToPeriodTypeFromBroker;

    // Only subscribe to the second market, periods 15s and 1m.
    client.subscribeToMarketPeriod(marketID2, p(Period.Period15S));
    client.subscribeToMarketPeriod(marketID2, p(Period.Period1M));
    const { response: sender1_res1 } = await emojicoin.buy(sender1, symbol1, ONE_APT_BIGINT);
    const { swap, response: sender2_res1 } = await emojicoin.buy(sender2, symbol2, ONE_APT_BIGINT);

    const getCandlesticks = (arr: BrokerEventModels[]) => arr.filter(isNonArenaCandlestickModel);

    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(maxBigInt(sender1_res1.version, sender2_res1.version));
    // Wait for it to receive the events.
    await customWaitFor(() => getCandlesticks(events).length === 2);

    // Ensure it didn't receive any extra events after a short buffer of time.
    await sleep(5000);
    expect(getCandlesticks(events)).toHaveLength(2);

    // Then check the expectations for the candlesticks.
    const candle15s = getCandlesticks(events).find((v) => v.period === Period.Period15S)!;
    const candle1m = getCandlesticks(events).find((v) => v.period === Period.Period1M)!;
    expect(candle15s).toBeDefined();
    expect(candle1m).toBeDefined();
    expect(candle15s.version).toEqual(BigInt(sender2_res1.version));
    expect(candle1m.version).toEqual(BigInt(sender2_res1.version));
    expect(candle15s.closePrice).toBeCloseTo(calculateCurvePrice(swap.model.state).toNumber(), 10);
    expect(candle1m.closePrice).toEqual(candle15s.closePrice);

    // Use a fresh events array to check upon reception of new messages/events.
    const events2: BrokerEventModels[] = [];
    client.setOnMessage((e) => {
      events2.push(e);
    });

    // Ensure it granularly subscribes to and unsubscribes from market + period combinations.
    // ---------------------------------------------------------------------------------------------

    // Subscribe to market 1 for all periods except 30m and 1d.
    const market1ExpectedPeriods = [
      Period.Period15S,
      Period.Period1M,
      Period.Period5M,
      Period.Period15M,
      Period.Period1H,
      Period.Period4H,
    ];

    // Add 1h and 1d periods for market 2, in addition to the existing 15s and 1m subs.
    const market2ExpectedPeriods = [
      Period.Period15S,
      Period.Period1M,
      Period.Period1H,
      Period.Period1D,
    ];

    const newSubscriptions = [
      ...market1ExpectedPeriods.map((period) => [marketID1, p(period)] as const),
      // Subscribe to 1H and 1D period for market 2, in addition to the existing 15s and 1m subs.
      [marketID2, p(Period.Period1H)],
      [marketID2, p(Period.Period1D)],
      // Subscribe to the 30m sub for market 2; note that it's unsubscribed from shortly after this.
      [marketID2, p(Period.Period30M)],
    ] as const;

    for (const [market, period] of newSubscriptions) {
      client.subscribeToMarketPeriod(market, period);
      await sleep(10);
    }

    client.unsubscribeFromMarketPeriod(marketID2, p(Period.Period30M));

    // Now ensure a swap for each market receives the proper periods.
    const { response: sender1_res2 } = await emojicoin.sell(sender1, symbol1, 10000000n);
    const { response: sender2_res2 } = await emojicoin.sell(sender2, symbol2, 10000000n);
    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(maxBigInt(sender1_res2.version, sender2_res2.version));

    const numCandlesticksFromSells = market1ExpectedPeriods.length + market2ExpectedPeriods.length;

    // Wait for it to receive the events.
    await customWaitFor(() => getCandlesticks(events2).length === numCandlesticksFromSells);

    // Ensure it didn't receive any extra events after a short buffer of time.
    await sleep(5000);
    expect(getCandlesticks(events2)).toHaveLength(numCandlesticksFromSells);

    const mkt1Candles = getCandlesticks(events2).filter((v) => v.marketID === marketID1);
    const mkt2Candles = getCandlesticks(events2).filter((v) => v.marketID === marketID2);

    expect(new Set(mkt1Candles.map((v) => v.period))).toEqual(new Set(market1ExpectedPeriods));
    expect(new Set(mkt2Candles.map((v) => v.period))).toEqual(new Set(market2ExpectedPeriods));
    expect(mkt1Candles).toHaveLength(market1ExpectedPeriods.length);
    expect(mkt2Candles).toHaveLength(market2ExpectedPeriods.length);
    // Explicitly check that the second market does not include a 30m period candlestick.
    expect(mkt2Candles.find((v) => v.period === Period.Period30M)).toBeUndefined();

    const unsubscriptionsMkt1 = mkt1Candles.map((c) => [marketID1, p(c.period)] as const);
    const unsubscriptionsMkt2 = mkt2Candles.map((c) => [marketID2, p(c.period)] as const);

    // Now unsubscribe from everything.
    for (const [market, period] of [...unsubscriptionsMkt1, ...unsubscriptionsMkt2]) {
      client.unsubscribeFromMarketPeriod(market, period);
      await sleep(10);
    }

    // Use a fresh events array to check upon reception of new messages/events.
    const events3: BrokerEventModels[] = [];
    client.setOnMessage((e) => {
      events3.push(e);
    });

    // Then subscribe to market2 30m candlesticks.
    client.subscribeToMarketPeriod(marketID2, p(Period.Period30M));

    // Do two more swaps, one for each market.
    const { response: sender1_res3 } = await emojicoin.buy(sender1, symbol1, ONE_APT_BIGINT);
    const { response: sender2_res3 } = await emojicoin.buy(sender2, symbol2, ONE_APT_BIGINT);
    // Wait for all responses to be processed by the indexer.
    await waitForEmojicoinIndexer(maxBigInt(sender1_res3.version, sender2_res3.version));

    // Wait for it to receive the event.
    await customWaitFor(() => getCandlesticks(events3).length === 1);

    // Ensure it didn't receive any extra events after a short buffer of time.
    await sleep(5000);
    expect(getCandlesticks(events3)).toHaveLength(1);

    // Check that the candlestick received was a 30m candlestick.
    const lone30mCandlestick = getCandlesticks(events3).at(0)!;
    expect(lone30mCandlestick).toBeDefined();
    expect(lone30mCandlestick.period).toEqual(Period.Period30M);
    expect(lone30mCandlestick.marketID).toEqual(marketID2);

    // Ensure the WebSocket's `onClose` function doesn't throw now since the test is complete.
    testIsFinished = true;
  }, 45000);
});
