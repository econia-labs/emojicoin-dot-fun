import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { isStateEvent, type Types } from "@sdk/types/types";
import { type EventStore } from "@store/event-store";
import { type FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { type TableCardProps } from "../table-card/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { StateTrigger } from "@sdk/const";
import { type EmojiPickerStore } from "@store/emoji-picker-store";

export type PropsWithTime = Omit<TableCardProps, "index" | "itemsPerLine"> & {
  key: string;
  time: number;
};
export type PropsWithTimeAndIndex = TableCardProps & { key: string; time: number };
export type WithTimeIndexAndShouldAnimate = PropsWithTimeAndIndex & {
  prevIndex?: number;
};

export const marketDataToProps = (data: FetchSortedMarketDataReturn["markets"]): PropsWithTime[] =>
  data.map((market) => ({
    key: market.symbol,
    time: market.bumpTime,
    symbol: market.symbol,
    marketID: market.marketID,
    emojis: market.emojis,
    staticMarketCap: market.marketCap.toString(),
    staticVolume24H: market.dailyVolume.toString(),
    staticNumSwaps: market.numSwaps.toString(),
  }));

export const stateEventsToProps = (
  firehose: EventStore["firehose"],
  getMarket: EventStore["getMarket"]
): PropsWithTime[] => {
  // State events are emitted with every single event related to bump order.
  // We can strictly only use state events to get the information we need to construct the bump
  // order data visually.
  const stateEvents = firehose.filter(isStateEvent) as Array<Types.StateEvent>;
  return stateEvents.map((e) => {
    const marketID = Number(e.marketID);
    const marketCap = getMarket(marketID)?.marketData?.marketCap;
    const volume24H = getMarket(marketID)?.marketData?.dailyVolume;
    const numSwaps = getMarket(marketID)?.marketData?.numSwaps;
    const emojiData = symbolBytesToEmojis(e.marketMetadata.emojiBytes);
    const { symbol, emojis } = emojiData;
    return {
      key: symbol,
      time: Number(e.stateMetadata.bumpTime),
      symbol,
      emojis,
      marketID: Number(marketID),
      staticMarketCap: (marketCap ?? 0).toString(),
      staticVolume24H: (volume24H ?? 0).toString(),
      staticNumSwaps: (numSwaps ?? 0).toString(),
    };
  });
};

export const deduplicateEventsByMarketID = (
  aggregate: PropsWithTime[]
): (PropsWithTime & { index: number })[] => {
  const marketIDs = new Set<number>();
  return aggregate.reduce(
    (acc, val) => {
      if (!marketIDs.has(val.marketID)) {
        acc.push({
          ...val,
          index: acc.length + 1,
        });
        marketIDs.add(val.marketID);
      }
      return acc;
    },
    [] as (PropsWithTime & { index: number })[]
  );
};

// Sorts by time. This is specifically for the bump order sorting and deduplication.
export const deduplicateAndSortEvents = (
  initial: PropsWithTime[],
  appended: PropsWithTime[]
): (PropsWithTime & { index: number })[] => {
  const aggregate = [...initial, ...appended];
  aggregate.sort((a, b) => b.time - a.time);
  return deduplicateEventsByMarketID(aggregate);
};

export const constructOrdered = ({
  data,
  stateFirehose,
  sortByBumpOrder,
  getMarket,
  getSearchEmojis = () => [],
}: {
  data: FetchSortedMarketDataReturn["markets"];
  stateFirehose: EventStore["stateFirehose"];
  sortByBumpOrder: boolean;
  getMarket: EventStore["getMarket"];
  getSearchEmojis?: EmojiPickerStore["getEmojis"];
}) => {
  // If the search emoji getter is passed in, we should filter events by the current search emojis.
  const searchEmojis = getSearchEmojis();
  const initial = !searchEmojis.length
    ? marketDataToProps(data).map((v, i) => ({ ...v, index: i }))
    : marketDataToProps(data).reduce(
        (acc, val) => {
          // We're filtering by search emojis- so only add the event state data if the emojis
          // in the event are in the search emojis.
          if (searchEmojis.some((s) => val.emojis.map((v) => v.emoji).includes(s))) {
            acc.push({
              ...val,
              index: acc.length + 1,
            });
          }
          return acc;
        },
        [] as (PropsWithTime & { index: number })[]
      );

  // If we're sorting by bump order, deduplicate and sort the events by bump order.
  if (sortByBumpOrder) {
    const bumps = stateEventsToProps(stateFirehose, getMarket);
    // Filter only if there are search emojis.
    const filteredBumps = !searchEmojis.length
      ? bumps
      : bumps.filter((bump) =>
          searchEmojis.some((s) => bump.emojis.map((v) => v.emoji).includes(s))
        );
    const latest = deduplicateAndSortEvents(
      initial,
      filteredBumps
    ) as WithTimeIndexAndShouldAnimate[];
    return latest.slice(0, MARKETS_PER_PAGE);
  }
  // Otherwise, we can add newly registered markets to the end of `ordered`. This is
  // a quick fix to registered markets not appearing in the grid, so eventually
  // we'd change this logic to actually filter by volume or market cap.
  const newRegistrationEvents = stateFirehose
    .filter((event) => event.stateMetadata.trigger === StateTrigger.MARKET_REGISTRATION)
    .filter(
      (event) =>
        // If there are no search emojis, this always returns true- otherwise, it filters.
        searchEmojis.length === 0 ||
        searchEmojis.some((e) =>
          symbolBytesToEmojis(event.marketMetadata.emojiBytes)
            .emojis.map((v) => v.emoji)
            .includes(e)
        )
    );
  // Sort *only* the registration events by time- *earliest* first.
  newRegistrationEvents.sort((a, b) => Number(a.stateMetadata.bumpTime - b.stateMetadata.bumpTime));
  const registers = stateEventsToProps(newRegistrationEvents, getMarket);
  const deduplicated = deduplicateEventsByMarketID([...initial, ...registers]);
  return deduplicated.slice(0, MARKETS_PER_PAGE);
};

export const filterBySearchEmojis = <T extends { emojis: Array<{ emoji: string }> }>(
  data: T[],
  emojis: string[]
): T[] => data.filter((d) => emojis.some((e) => d.emojis.map((v) => v.emoji).includes(e)));

export const filterStateEventsBySearchEmojis = (
  data: Types.StateEvent[],
  searchEmojis: string[]
): Types.StateEvent[] =>
  data.filter((d) =>
    searchEmojis.some((e) =>
      symbolBytesToEmojis(d.marketMetadata.emojiBytes)
        .emojis.map((v) => v.emoji)
        .includes(e)
    )
  );
