import { type MarketEmojiData, toMarketEmojiData } from "@sdk/emoji_data";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import {
  type ArenaEventModels,
  type ArenaVaultBalanceUpdateModel,
  type ArenaInfoModel,
  type ArenaEventModelWithMeleeID,
} from "@sdk/indexer-v2";
import { isArenaEnterModel, isArenaExitModel, isArenaMeleeModel } from "@sdk/types/arena-types";

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

export const toMappedMelees = <T extends ArenaEventModelWithMeleeID>(models: T[]) => {
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

export const getMeleeIDFromArenaModel = (
  model: Exclude<ArenaEventModels, ArenaVaultBalanceUpdateModel>
): bigint => {
  if (isArenaMeleeModel(model)) {
    return model.melee.meleeID;
  } else if (isArenaEnterModel(model)) {
    return model.enter.meleeID;
  } else if (isArenaExitModel(model)) {
    return model.exit.meleeID;
  }
  return model.swap.meleeID;
};
