import type { ArenaInfoModel } from "../../../types";
import { fetchPositionJson } from "../../app/arena";
import type { UserPositionResponse } from "./types";

export const fetchPositionWithArenaInfo = async ({
  user,
  arenaInfo,
}: {
  user: `0x${string}`;
  arenaInfo: ArenaInfoModel;
}): Promise<UserPositionResponse> => {
  const position = await fetchPositionJson({ user, meleeID: arenaInfo.meleeID });
  if (!position) return null;
  return {
    ...position,
    emojicoin_0_symbols: arenaInfo.emojicoin0Symbols,
    emojicoin_0_market_id: arenaInfo.emojicoin0MarketID.toString(),
    emojicoin_1_symbols: arenaInfo.emojicoin1Symbols,
    emojicoin_1_market_id: arenaInfo.emojicoin1MarketID.toString(),
  };
};
