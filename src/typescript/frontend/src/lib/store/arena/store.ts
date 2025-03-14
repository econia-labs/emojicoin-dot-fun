import { ArenaPeriod, Period } from "@sdk/const";
import {
  type ArenaMeleeModel,
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaSwapModel,
  type ArenaInfoModel,
} from "@sdk/indexer-v2";
import { type WritableDraft } from "immer";
import { type ArenaChartSymbol } from "lib/chart-utils";
import { type CandlestickPeriod } from "../event/types";
import { createPeriodData } from "../event/utils";

export type MeleeState = {
  swaps: readonly ArenaSwapModel[];
  enters: readonly ArenaEnterModel[];
  exits: readonly ArenaExitModel[];
  [ArenaPeriod.Period15S]: CandlestickPeriod;
  [Period.Period1M]: CandlestickPeriod;
  [Period.Period5M]: CandlestickPeriod;
  [Period.Period15M]: CandlestickPeriod;
  [Period.Period30M]: CandlestickPeriod;
  [Period.Period1H]: CandlestickPeriod;
  [Period.Period4H]: CandlestickPeriod;
  [Period.Period1D]: CandlestickPeriod;
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
  [ArenaPeriod.Period15S]: createPeriodData(),
  [Period.Period1M]: createPeriodData(),
  [Period.Period5M]: createPeriodData(),
  [Period.Period15M]: createPeriodData(),
  [Period.Period30M]: createPeriodData(),
  [Period.Period1H]: createPeriodData(),
  [Period.Period4H]: createPeriodData(),
  [Period.Period1D]: createPeriodData(),
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
