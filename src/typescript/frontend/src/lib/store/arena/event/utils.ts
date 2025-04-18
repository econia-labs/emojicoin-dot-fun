import type { WritableDraft } from "immer";

import type { ArenaCandlestickModel, ArenaModelWithMeleeID } from "@/sdk/indexer-v2";
import {
  isArenaCandlestickModel,
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaSwapModel,
} from "@/sdk/types/arena-types";

import type { LatestBar } from "../../event/candlestick-bars";
import { getCandlestickModelNonce, toBarWithNonce } from "../../event/candlestick-bars";
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
  const { period } = model;
  const incomingNonce = getCandlestickModelNonce(model);
  const current = melee[period];
  const shouldCreateNewBar =
    !current.latestBar || current.latestBar.time !== model.startTime.getTime();

  if (shouldCreateNewBar) {
    current.latestBar = {
      ...toBarWithNonce(model),
      open: current.latestBar?.close ?? model.openPrice,
      period,
    };
  } else if (!current.latestBar) {
    throw new Error("This should never occur. It is a type guard/hint.");
  } else if (incomingNonce >= current.latestBar.nonce) {
    // A latest bar exists in state and a new bar should not be created.
    // Since this incoming model data hasn't been processed by the datafeed API utilities used to
    // update the open prices, the open price must be manually set to the latest bar's open price.
    current.latestBar = {
      ...toBarWithNonce(model),
      open: current.latestBar.open,
      period,
    };
  }
  callbackClonedLatestBarIfSubscribed(current.callback, current.latestBar);
};

/**
 * Update the latest bar from data fetched from the datafeed API.
 *
 * These should have had their open prices already corrected to be the last candlestick bar's
 * closing price.
 *
 * Thus, the only thing to do here is just update the latest bar if it's stale or doesn't exist.
 */
export const updateLatestBarFromDatafeed = (
  melee: WritableDraft<MeleeState>,
  // Has already had its open price corrected in the curried bars reducer after being fetched.
  barFromDatafeed: LatestBar
) => {
  const { period } = barFromDatafeed;
  const current = melee[period];

  if (!current.latestBar || current.latestBar.nonce < barFromDatafeed.nonce) {
    current.latestBar = barFromDatafeed;
    callbackClonedLatestBarIfSubscribed(current.callback, current.latestBar);
  }
};
