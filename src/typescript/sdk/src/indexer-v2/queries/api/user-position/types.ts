import type { ArenaInfoModel, ArenaPositionModel, DatabaseJsonType } from "../../../types";
import { toArenaPositionModel } from "../../../types";

/**
 * The response type returned from
 * {@link [/api/arena/position/[user]](../../../../../frontend/src/app/api/arena/position/[user]/route.ts)}
 */
export type UserPositionResponse =
  | (DatabaseJsonType["arena_position"] & PartialArenaInfoJson)
  | null;

type PartialArenaInfoJson = Pick<
  DatabaseJsonType["arena_info"],
  "emojicoin_0_symbols" | "emojicoin_1_symbols" | "emojicoin_0_market_id" | "emojicoin_1_market_id"
>;

/**
 * The converted response type from {@link UserPositionResponse}. That is, non-JSON serializable
 * data with bigints.
 */
/* eslint-disable-next-line import/no-unused-modules */
export type UserPositionWithInfo = ArenaPositionModel & PartialArenaInfoModel;

type PartialArenaInfoModel = Pick<
  ArenaInfoModel,
  "emojicoin0Symbols" | "emojicoin0MarketID" | "emojicoin1Symbols" | "emojicoin1MarketID"
>;

/* eslint-disable-next-line import/no-unused-modules */
export const toUserPositionWithInfo = (data: UserPositionResponse) => {
  if (!data) return null;
  return {
    ...toArenaPositionModel(data),
    emojicoin0Symbols: data.emojicoin_0_symbols,
    emojicoin0MarketID: BigInt(data.emojicoin_0_market_id),
    emojicoin1Symbols: data.emojicoin_1_symbols,
    emojicoin1MarketID: BigInt(data.emojicoin_1_market_id),
  };
};
