import { type OrderByStrings, toOrderBy } from "@sdk/indexer-v2/const";
import { SortMarketsBy } from "@sdk/indexer-v2/types";
import { type SortByPageQueryParams } from "lib/queries/sorting/types";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { ROUTES } from "router/routes";

export enum StatsColumn {
  AllTimeVolume = "all_time_volume",
  PriceDelta = "delta",
  DailyVolume = "daily_vol",
  LastAvgPrice = "last_avg_price",
  Tvl = "tvl",
  MarketCap = "market_cap",
}

export type StatsSearchParams = Exclude<SortByPageQueryParams, "bump" | "apr"> | "delta";
export type StatsPageSearchParams = {
  page: string | undefined;
  sort: StatsSearchParams | undefined;
  order: OrderByStrings | undefined;
};

export const toStatsPageParamsWithDefault = (searchParams: StatsPageSearchParams | undefined) => {
  const { page: pageInput, sort, order = "desc" } = searchParams ?? {};

  const sortBy = statsSearchParamToPostgresParam(sort);
  const page = safeParsePageWithDefault(pageInput);
  const orderBy = toOrderBy(order);

  return {
    sortBy,
    page,
    orderBy,
  };
};

const searchParamToPostgres: {
  [key in StatsSearchParams]:
    | Exclude<SortMarketsBy, SortMarketsBy.Apr | SortMarketsBy.BumpOrder>
    | "delta";
} = {
  all_time_vol: SortMarketsBy.AllTimeVolume,
  daily_vol: SortMarketsBy.DailyVolume,
  delta: "delta",
  market_cap: SortMarketsBy.MarketCap,
  tvl: SortMarketsBy.Tvl,
  price: SortMarketsBy.Price,
};

const statsSearchParamToPostgresParam = (sort?: StatsSearchParams) => {
  if (!sort || !searchParamToPostgres[sort]) {
    return SortMarketsBy.MarketCap;
  }
  return searchParamToPostgres[sort];
};

export const constructURLForStatsPage = ({
  sort,
  desc,
  page,
}: {
  sort: StatsColumn;
  desc: boolean;
  page?: number;
}) => {
  const sortString = statsColumnToSearchParam(sort);
  const descParam = desc ? "" : "&order=asc";
  const pageParam = !page || page === 1 || page < 1 ? "" : `&page=${page}`;
  return `${ROUTES.stats["."]}?sort=${sortString}${descParam}${pageParam}`;
};

const statsParamToColumn: { [key in StatsSearchParams]: StatsColumn } = {
  all_time_vol: StatsColumn.AllTimeVolume,
  daily_vol: StatsColumn.DailyVolume,
  delta: StatsColumn.PriceDelta,
  market_cap: StatsColumn.MarketCap,
  price: StatsColumn.LastAvgPrice,
  tvl: StatsColumn.Tvl,
};

export const statsSearchParamsToColumn = (sortBy: StatsSearchParams): StatsColumn =>
  statsParamToColumn[sortBy];

const statsColumnToParam: { [key in StatsColumn]: StatsSearchParams } = {
  all_time_volume: "all_time_vol",
  daily_vol: "daily_vol",
  delta: "delta",
  last_avg_price: "price",
  market_cap: "market_cap",
  tvl: "tvl",
};

export const statsColumnToSearchParam = (column: StatsColumn): StatsSearchParams =>
  statsColumnToParam[column];
