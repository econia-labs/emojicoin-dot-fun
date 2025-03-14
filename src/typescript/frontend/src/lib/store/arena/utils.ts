import { type MarketEmojiData, toMarketEmojiData } from "@sdk/emoji_data";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type ArenaInfoModel, type ArenaModelWithMeleeID } from "@sdk/indexer-v2";
import {
  isArenaCandlestickModel,
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaSwapModel,
} from "@sdk/types/arena-types";

export type ArenaMarketPair = {
  market0: {
    marketID: bigint;
    marketAddress: AccountAddressString;
    symbol: string;
  } & MarketEmojiData;
  market1: {
    marketID: bigint;
    marketAddress: AccountAddressString;
    symbol: string;
  } & MarketEmojiData;
};

export const toArenaMarketPair = (info: ArenaInfoModel): ArenaMarketPair => {
  const symbol0 = info.emojicoin0Symbols.join("");
  const symbol1 = info.emojicoin1Symbols.join("");
  return {
    market0: {
      marketID: info.emojicoin0MarketID,
      marketAddress: info.emojicoin0MarketAddress,
      symbol: symbol0,
      ...toMarketEmojiData(symbol0),
    },
    market1: {
      marketID: info.emojicoin1MarketID,
      marketAddress: info.emojicoin1MarketAddress,
      symbol: symbol1,
      ...toMarketEmojiData(symbol1),
    },
  };
};

export const toMappedMelees = <T extends ArenaModelWithMeleeID>(models: T[]) => {
  const map = new Map<bigint, T[]>();

  models.forEach((model) => {
    const id = getMeleeIDFromArenaModel(model);
    if (!map.has(id)) {
      map.set(id, []);
    }
    map.get(id)!.push(model);
  });
  return map;
};

export const getMeleeIDFromArenaModel = (model: ArenaModelWithMeleeID): bigint => {
  if (isArenaMeleeModel(model)) {
    return model.melee.meleeID;
  } else if (isArenaEnterModel(model)) {
    return model.enter.meleeID;
  } else if (isArenaExitModel(model)) {
    return model.exit.meleeID;
  } else if (isArenaSwapModel(model)) {
    return model.swap.meleeID;
  } else if (isArenaCandlestickModel(model)) {
    return model.meleeID;
  }
  throw new Error("Invalid arena model for `getMeleeID`: ", model);
};
