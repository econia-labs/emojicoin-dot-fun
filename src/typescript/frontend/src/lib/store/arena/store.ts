import { ArenaPeriod, Period } from "@sdk/const";
import {
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaInfoModel,
  type ArenaMeleeModel,
  type ArenaSwapModel,
} from "@sdk/indexer-v2";
import { type WritableDraft } from "immer";
import { type ArenaChartSymbol } from "lib/chart-utils";

import { type CandlestickData } from "../event/types";
import { createInitialCandlestickData } from "../utils";

export type MeleeState = {
  swaps: readonly ArenaSwapModel[];
  enters: readonly ArenaEnterModel[];
  exits: readonly ArenaExitModel[];
  [ArenaPeriod.Period15S]: CandlestickData;
  [Period.Period1M]: CandlestickData;
  [Period.Period5M]: CandlestickData;
  [Period.Period15M]: CandlestickData;
  [Period.Period30M]: CandlestickData;
  [Period.Period1H]: CandlestickData;
  [Period.Period4H]: CandlestickData;
  [Period.Period1D]: CandlestickData;
};

export type ArenaState = {
  arenaInfoFromServer?: ArenaInfoModel;
  meleeEvents: readonly ArenaMeleeModel[];
  melees: Readonly<Map<bigint, MeleeState>>;
  meleeMap: Readonly<Map<ArenaChartSymbol, bigint>>;
};

export type ArenaActions = {
  loadArenaInfoFromServer: (info: ArenaInfoModel) => void;
};

export const createInitialMeleeState = (): WritableDraft<MeleeState> => ({
  swaps: [],
  enters: [],
  exits: [],
  [ArenaPeriod.Period15S]: createInitialCandlestickData(),
  [Period.Period1M]: createInitialCandlestickData(),
  [Period.Period5M]: createInitialCandlestickData(),
  [Period.Period15M]: createInitialCandlestickData(),
  [Period.Period30M]: createInitialCandlestickData(),
  [Period.Period1H]: createInitialCandlestickData(),
  [Period.Period4H]: createInitialCandlestickData(),
  [Period.Period1D]: createInitialCandlestickData(),
});

export const ensureMeleeInStore = (state: WritableDraft<ArenaState>, meleeID: bigint) => {
  if (!state.melees.has(meleeID)) {
    state.melees.set(meleeID, createInitialMeleeState());
  }
};

export const initializeArenaStore = (): ArenaState => ({
  arenaInfoFromServer: undefined,
  meleeEvents: [],
  melees: new Map(),
  meleeMap: new Map(),
});
