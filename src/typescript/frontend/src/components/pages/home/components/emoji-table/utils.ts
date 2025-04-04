import type { HomePageProps } from "app/home/HomePage";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import _ from "lodash";

import type { SymbolEmoji } from "@/sdk/emoji_data";
import type { EmojiPickerStore } from "@/store/emoji-picker-store";
import type { EventStore } from "@/store/event/types";

import type { TableCardProps } from "../table-card/types";

type PropsWithTime = Omit<TableCardProps, "index" | "rowLength"> & {
  time: number;
};
export type PropsWithTimeAndIndex = TableCardProps & {
  time: number;
  searchEmojisKey: string;
};

const toSearchEmojisKey = (searchEmojis: string[]) => `{${searchEmojis.join("")}}`;

export const marketDataToProps = (markets: HomePageProps["markets"]): PropsWithTime[] =>
  markets.map((m) => ({
    time: Number(m.market.time),
    symbol: m.market.symbolData.symbol,
    marketID: Number(m.market.marketID),
    emojis: m.market.emojis,
    staticMarketCap: m.state.instantaneousStats.marketCap,
    staticVolume24H: m.dailyVolume,
  }));

const stateEventsToProps = (
  firehose: EventStore["stateFirehose"],
  getMarket: EventStore["getMarket"],
  searchEmojis: string[]
): PropsWithTime[] => {
  // State events are emitted with every single event related to bump order.
  // We can strictly only use state events to get the information we need to construct the bump
  // order data visually.
  return firehose.map((e) => {
    const marketID = Number(e.market.marketID);
    const { emojis } = e.market;
    const symbol = e.market.symbolData.symbol;
    const marketCap = e.state.instantaneousStats.marketCap;
    const volume24H = getMarket(e.market.symbolEmojis)?.dailyVolume;
    return {
      time: Number(e.market.time),
      symbol,
      emojis,
      marketID: Number(marketID),
      staticMarketCap: marketCap,
      staticVolume24H: volume24H ?? 0n,
      trigger: e.market.trigger,
      searchEmojisKey: toSearchEmojisKey(searchEmojis),
    };
  });
};

export const constructOrdered = ({
  markets,
  stateFirehose,
  getMarket,
  getSearchEmojis,
  isFavoriteFilterEnabled,
}: {
  markets: HomePageProps["markets"];
  stateFirehose: EventStore["stateFirehose"];
  getMarket: EventStore["getMarket"];
  getSearchEmojis: EmojiPickerStore["getEmojis"];
  isFavoriteFilterEnabled: boolean;
}) => {
  // We don't need to filter the fetched data because it's already filtered and sorted by the
  // server. We only need to filter event store state events.
  const searchEmojis = getSearchEmojis() as Array<SymbolEmoji>;
  const initial = marketDataToProps(markets);

  const bumps = stateEventsToProps(stateFirehose, getMarket, searchEmojis);
  // Filter only if there are search emojis.
  const filteredBumps = !searchEmojis.length
    ? bumps
    : bumps.filter((bump) => searchEmojis.some((s) => bump.emojis.map((v) => v.emoji).includes(s)));

  // When filtering by favorites, initial market state will have all the markets
  // Because home page can have up to 50 markets per page, but favorites is limited to 25
  // So we keep the initial markets, and simply override time
  // Otherwise, we merge initial markets and markets from store
  const combined = isFavoriteFilterEnabled
    ? [...initial].map((ini) => {
        const bumped = filteredBumps.find((b) => b.marketID === ini.marketID);
        return bumped ? { ...ini, time: bumped.time } : ini;
      })
    : _.uniqBy([...initial, ...filteredBumps], (i) => i.marketID);

  // Sort by bump time
  const latest = _.orderBy(combined, (i) => i.time, "desc") as PropsWithTimeAndIndex[];

  return latest.slice(0, MARKETS_PER_PAGE);
};

export const toSerializedGridOrder = <T extends { marketID: number }>(data: T[]) =>
  data.map((v) => v.marketID).join(",");
