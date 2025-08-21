import type { JsonMeleeDataArgs } from "app/arena/fetch-melee-data";
import { readFileSync } from "fs";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";
import path from "path";

import type { DatabaseJsonType } from "@/sdk/index";

export type HomePageDataDictionary = {
  [k in MarketDataSortByHomePage]: {
    [page: number]: DatabaseJsonType["market_state"][];
  };
};

export type MarketPageDataDictionary = {
  [symbolEmojisJoined: string]: DatabaseJsonType["market_state"];
};

export type PrebuildData = {
  pages: HomePageDataDictionary;
  markets: MarketPageDataDictionary;
  num_markets: number;
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
