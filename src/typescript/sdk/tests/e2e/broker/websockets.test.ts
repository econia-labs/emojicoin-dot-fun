import {
  compareBigInt,
  encodeEmojisToSymbol,
  enumerate,
  getEmojicoinMarketAddressAndTypeTags,
  getEvents,
  type MarketEmojiData,
  type MarketSymbolEmojis,
  maxBigInt,
  ONE_APT,
  sleep,
  SYMBOL_DATA,
  toMarketEmojiData,
  type Types,
  zip,
} from "../../../src";
import {
  Chat,
  ProvideLiquidity,
  RegisterMarket,
  Swap,
  SwapWithRewards,
} from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { EXACT_TRANSITION_INPUT_AMOUNT, getAptosClient } from "../../utils";
import { getFundedAccounts } from "../../utils/test-accounts";
import { type BrokerEvent } from "../../../src/broker-v2/types";
import {
  isChatEventModel,
  isMarketLatestStateEventModel,
  isMarketRegistrationEventModel,
  isSwapEventModel,
} from "../../../src/indexer-v2/types";
import { AccountAddress, type TypeTag } from "@aptos-labs/ts-sdk";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries";
import { convertWebSocketMessageToBrokerEvent } from "../../../src/broker-v2/client";

import { waitFor, connectNewClient, compareParsedData, subscribe } from "./utils";

jest.setTimeout(20000);

describe("tests to ensure that websocket event subscriptions work as expected", () => {
  const registrants = getFundedAccounts("040", "041", "042", "043", "044", "045");
  const { aptos } = getAptosClient();
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
    emojiBytes: [SYMBOL_DATA.byEmojiStrict("⚔️").bytes],
    emojiIndicesSequence: new Uint8Array([0]),
  };

  const marketData: MarketEmojiData[] = (
    [["🍌"], ["🍟"], ["🍺"], ["🍦"], ["🍌", "🍟"], ["🍉", "🍉"]] as MarketSymbolEmojis[]
  )
    .map(encodeEmojisToSymbol)
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

    await waitFor(() => messageEvents.length === 1);
    const messageEvent = messageEvents.pop()!;
    expect(messageEvent).toBeDefined();
    const event = convertWebSocketMessageToBrokerEvent(messageEvent);
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

    await waitFor(() => messageEvents.length === 1);
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

    await waitFor(() => messageEvents.length === 1);
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

    await waitFor(() => messageEvents.length === 2);
    // Since they're pushed at the same time, we only have to find the index of one, then we know
    // all the arrays should have the same index for the corresponding message event type.
    const swapIndex = events.findIndex(
      (e) => e.transaction.version === BigInt(swapResponse.version)
    );
    const liquidityIndex = events.findIndex(
      (e) => e.transaction.version === BigInt(liquidityResponse.version)
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
    await waitFor(() => messageEvents.length >= 2);
    expect(messageEvents.length === 2);
    expect(brokerMessages.length === 2);
    expect(events.length === 2);
    expect(events.every((e) => e.eventName === "Chat")).toBe(true);

    for (const [event, i] of enumerate(events)) {
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
      emojis: toMarketEmojiData(encodeEmojisToSymbol(["⚓"])).emojis.map((emoji) => emoji.bytes),
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
    await waitFor(() => messageEvents.length >= 2);
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

    subscribe(client, [], []);

    const market_1 = marketsRegistered[MARKET_INDEX];
    const registerResponse = await RegisterMarket.submit({
      ...senderArgs[MARKET_INDEX],
      emojis: toMarketEmojiData(encodeEmojisToSymbol(["⚓⚓"])).emojis.map((emoji) => emoji.bytes),
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
    await waitFor(() => messageEvents.length === 10);
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
});
