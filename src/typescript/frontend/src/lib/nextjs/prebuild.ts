import type { JsonMeleeDataArgs } from "app/arena/fetch-melee-data";
import type { StatsSchemaInput } from "app/stats/(utils)/schema";
import { readFileSync } from "fs";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";
import path from "path";

import type { DatabaseJsonType } from "@/sdk/index";

type StatsSlugs = Required<StatsSchemaInput>;

export type StatsPageDataDictionary = {
  [k in StatsSlugs["sort"]]: {
    [page: number]: {
      [order in StatsSlugs["order"]]: DatabaseJsonType["price_feed_with_nulls"][];
    };
  };
};

export type HomePageDataDictionary = {
  [k in MarketDataSortByHomePage]: {
    [page: number]: DatabaseJsonType["market_state"][];
  };
};

export type MarketPageDataDictionary = {
  [symbolEmojisJoined: string]: DatabaseJsonType["market_state"];
};

export type PrebuildData = {
  stats_pages: StatsPageDataDictionary;
  home_pages: HomePageDataDictionary;
  markets: MarketPageDataDictionary;
  num_markets: number;
  num_markets_with_daily_activity: number;
  price_feed: DatabaseJsonType["price_feed"][];
  melee_data: JsonMeleeDataArgs | null;
  apt_price: number | undefined;
};

const findFrontendRoot = (dir = __dirname): string => {
  while (dir !== path.dirname(dir)) {
    if (path.basename(dir) === "frontend" && path.basename(path.dirname(dir)) === "typescript")
      return dir;
    dir = path.dirname(dir);
  }
  throw new Error("Could not find typescript/frontend directory");
};

export const getPrebuildFileData = () => {
  if (!IS_NEXT_BUILD_PHASE) return undefined;
  const filePath = path.join(findFrontendRoot(), ".shared-build-data/pages.json");
  const fileData = readFileSync(filePath, "utf-8");
  const data: PrebuildData = JSON.parse(fileData);
  return data;
};
