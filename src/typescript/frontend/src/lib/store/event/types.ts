import { type AnyPeriod, type Period } from "@sdk/const";
import { type SymbolEmoji } from "@sdk/emoji_data";
import {
  type BrokerEventModels,
  type DatabaseModels,
  type MarketMetadataModel,
} from "@sdk/indexer-v2/types";
import { type Flatten } from "@sdk-types";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import { type WritableDraft } from "immer";
import { type ArenaChartSymbol } from "lib/chart-utils";

import { type ArenaActions, type ArenaState } from "../arena/store";
import { type ClientActions, type ClientState } from "../websocket/store";
import { type LatestBar } from "./candlestick-bars";

// Aliased to avoid repeating the type names over and over.
type Swap = DatabaseModels["swap_events"];
type Chat = DatabaseModels["chat_events"];
type MarketRegistration = DatabaseModels["market_registration_events"];
type MarketLatestStateEvent = DatabaseModels["market_latest_state_event"];
type Liquidity = DatabaseModels["liquidity_events"];
type GlobalState = DatabaseModels["global_state_events"];
type MarketLatestState = DatabaseModels["market_state"];

export type SymbolString = string;

export type CandlestickData = {
  callback: SubscribeBarsCallback | undefined;
  latestBar: LatestBar | undefined;
};

export type MarketStoreMetadata = Flatten<
  Omit<MarketMetadataModel, "time" | "marketNonce" | "trigger">
>;

export type MarketEventStore = {
  marketMetadata: MarketStoreMetadata;
  dailyVolume?: bigint;
  swapEvents: readonly Swap[];
  liquidityEvents: readonly Liquidity[];
  stateEvents: readonly (MarketLatestStateEvent | MarketLatestState)[];
  chatEvents: readonly Chat[];
  [Period.Period1M]: CandlestickData;
  [Period.Period5M]: CandlestickData;
  [Period.Period15M]: CandlestickData;
  [Period.Period30M]: CandlestickData;
  [Period.Period1H]: CandlestickData;
  [Period.Period4H]: CandlestickData;
  [Period.Period1D]: CandlestickData;
};

export type EventState = {
  guids: Readonly<Set<string>>;
  stateFirehose: readonly (MarketLatestStateEvent | MarketLatestState)[];
  marketRegistrations: readonly MarketRegistration[];
  markets: Readonly<Map<SymbolString, MarketEventStore>>;
  globalStateEvents: Readonly<GlobalState[]>;
};

export type PeriodSubscription = {
  symbol: string | ArenaChartSymbol;
  period: AnyPeriod;
  cb: SubscribeBarsCallback;
};

export type SetLatestBarsArgs = {
  marketMetadata: MarketStoreMetadata;
  latestBars: readonly LatestBar[];
};

export type EventActions = {
  getMarket: (m: SymbolEmoji[]) => undefined | Readonly<MarketEventStore>;
  getRegisteredMarkets: () => Readonly<EventState["markets"]>;
  getMeleeMap: () => Readonly<ArenaState["meleeMap"]>;
  loadMarketStateFromServer: (states: DatabaseModels["market_state"][]) => void;
  loadEventsFromServer: (events: BrokerEventModels[]) => void;
  pushEventsFromClient: (event: BrokerEventModels[], pushToLocalStorage?: boolean) => void;
  setLatestBars: ({ marketMetadata, latestBars }: SetLatestBarsArgs) => void;
  subscribeToPeriod: ({ symbol, period, cb }: PeriodSubscription) => void;
  unsubscribeFromPeriod: ({ symbol, period }: Omit<PeriodSubscription, "cb">) => void;
};

export type EventStore = EventState & EventActions & ArenaState & ArenaActions;

export type EventAndClientStore = EventState &
  EventActions &
  ClientState &
  ClientActions &
  ArenaState;

export type ImmerSetEventAndClientStore = (
  nextStateOrUpdater:
    | EventAndClientStore
    | Partial<EventAndClientStore>
    | ((state: WritableDraft<EventAndClientStore>) => void),
  shouldReplace?: boolean | undefined
) => void;

export type ImmerGetEventAndClientStore = () => EventAndClientStore;
