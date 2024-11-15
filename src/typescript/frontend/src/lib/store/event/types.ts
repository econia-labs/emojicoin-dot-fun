import { type Period } from "@sdk/const";
import { type SymbolEmoji } from "@sdk/emoji_data";
import {
  type MarketMetadataModel,
  type AnyEventModel,
  type DatabaseModels,
} from "@sdk/indexer-v2/types";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import { type LatestBar } from "./candlestick-bars";
import { type WritableDraft } from "immer";
import { type ClientState, type ClientActions } from "../websocket/store";

// Aliased to avoid repeating the type names over and over.
type Swap = DatabaseModels["swap_events"];
type Chat = DatabaseModels["chat_events"];
type MarketRegistration = DatabaseModels["market_registration_events"];
type PeriodicState = DatabaseModels["periodic_state_events"];
type MarketLatestStateEvent = DatabaseModels["market_latest_state_event"];
type Liquidity = DatabaseModels["liquidity_events"];
type GlobalState = DatabaseModels["global_state_events"];
type MarketLatestState = DatabaseModels["market_state"];

export type SymbolString = string;

export type CandlestickData = {
  candlesticks: readonly PeriodicState[];
  callback: SubscribeBarsCallback | undefined;
  latestBar: LatestBar | undefined;
};

export type MarketEventStore = {
  marketMetadata: MarketMetadataModel;
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
  globalStateEvents: Readonly<Array<GlobalState>>;
};

export type PeriodSubscription = {
  marketEmojis: SymbolEmoji[];
  period: Period;
  cb: SubscribeBarsCallback;
};

export type SetLatestBarsArgs = {
  marketMetadata: MarketMetadataModel;
  latestBars: readonly LatestBar[];
};

export type EventActions = {
  getMarket: (m: SymbolEmoji[]) => undefined | Readonly<MarketEventStore>;
  getRegisteredMarkets: () => Readonly<EventState["markets"]>;
  loadMarketStateFromServer: (states: Array<DatabaseModels["market_state"]>) => void;
  loadEventsFromServer: (events: Array<AnyEventModel>) => void;
  pushEventFromClient: (event: AnyEventModel, localize?: boolean) => void;
  setLatestBars: ({ marketMetadata, latestBars }: SetLatestBarsArgs) => void;
  subscribeToPeriod: ({ marketEmojis, period, cb }: PeriodSubscription) => void;
  unsubscribeFromPeriod: ({ marketEmojis, period }: Omit<PeriodSubscription, "cb">) => void;
};

export type EventStore = EventState & EventActions;

export type EventAndClientStore = EventState & EventActions & ClientState & ClientActions;

export type ImmerSetEventAndClientStore = (
  nextStateOrUpdater:
    | EventAndClientStore
    | Partial<EventAndClientStore>
    | ((state: WritableDraft<EventAndClientStore>) => void),
  shouldReplace?: boolean | undefined
) => void;

export type ImmerGetEventAndClientStore = () => EventAndClientStore;
