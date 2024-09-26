import { type Period } from "@sdk/const";
import { type MarketSymbolEmojis } from "@sdk/emoji_data";
import {
  type MarketMetadataModel,
  type AnyEventModel,
  type TableModels,
} from "@sdk/indexer-v2/types";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import { type LatestBar } from "./candlestick-bars";

// Aliased to avoid repeating the type names over and over.
type Swap = TableModels["swap_events"];
type Chat = TableModels["chat_events"];
type MarketRegistration = TableModels["market_registration_events"];
type PeriodicState = TableModels["periodic_state_events"];
type MarketLatestStateEvent = TableModels["market_latest_state_event"];
type Liquidity = TableModels["liquidity_events"];
type GlobalState = TableModels["global_state_events"];
type MarketLatestState = TableModels["market_state"];

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
  marketEmojis: MarketSymbolEmojis;
  period: Period;
  cb: SubscribeBarsCallback;
};

export type SetLatestBarsArgs = {
  marketMetadata: MarketMetadataModel;
  latestBars: readonly LatestBar[];
};

export type EventActions = {
  getMarket: (m: MarketSymbolEmojis) => undefined | Readonly<MarketEventStore>;
  getRegisteredMarkets: () => Readonly<EventState["markets"]>;
  loadMarketStateFromServer: (states: Array<TableModels["market_state"]>) => void;
  loadEventsFromServer: (events: Array<AnyEventModel>) => void;
  pushEventFromClient: (event: AnyEventModel) => void;
  setLatestBars: ({ marketMetadata, latestBars }: SetLatestBarsArgs) => void;
  subscribeToPeriod: ({ marketEmojis, period, cb }: PeriodSubscription) => void;
  unsubscribeFromPeriod: ({ marketEmojis, period }: Omit<PeriodSubscription, "cb">) => void;
};

export type EventStore = EventState & EventActions;
