import type { WritableDraft } from "immer";

import type { ArenaCandlestickModel, ArenaModelWithMeleeID } from "@/sdk/indexer-v2";
import {
  isArenaCandlestickModel,
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaSwapModel,
} from "@/sdk/types/arena-types";
import { toNominal } from "@/sdk/utils";

import { toBar } from "../../event/candlestick-bars";
import { callbackClonedLatestBarIfSubscribed } from "../../utils";
import type { MeleeState } from "./store";

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

/**
 * Arena candlestick model data is already validated by the db, so use the data if it's newer than
 * what's in the current latest bar.
 */
export const handleLatestBarForArenaCandlestick = (
  melee: WritableDraft<MeleeState>,
  model: ArenaCandlestickModel
) => {
  // Arena candlesticks are emitted once per transaction block, so the comparator nonce can just be
  // the candlestick's latest transaction version.
  const { period, version: nonce } = model;
  const current = melee[period];
  if (!current.latestBar) {
    current.latestBar = {
      ...toBar(model),
      period,
      nonce,
    };
  } else if (current.latestBar.nonce < nonce) {
    current.latestBar = {
      time: model.startTime.getTime(),
      open: current.latestBar?.open ?? model.openPrice,
      high: Math.max(current.latestBar?.high, model.highPrice),
      low: Math.min(current.latestBar?.low, model.lowPrice),
      close: model.closePrice,
      volume: (current.latestBar.volume += toNominal(model.volume)),
      period,
      nonce,
    };
  }
  callbackClonedLatestBarIfSubscribed(current.callback, current.latestBar);
};
