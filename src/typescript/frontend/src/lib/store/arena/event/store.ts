import type { WritableDraft } from "immer";
import type { ArenaChartSymbol } from "lib/chart-utils";

import { ArenaPeriod, Period } from "@/sdk/const";
import type {
  ArenaEnterModel,
  ArenaExitModel,
  ArenaInfoModel,
  ArenaMeleeModel,
  ArenaSwapModel,
  BrokerEventModels,
} from "@/sdk/indexer-v2";
import {
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaVaultBalanceUpdateModel,
} from "@/sdk/types/arena-types";

import type { CandlestickData } from "../../event/types";
import { createInitialCandlestickData } from "../../utils";

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
  vaultBalance: bigint | undefined;
};

export type ArenaActions = {
  loadArenaInfoFromServer: (info: ArenaInfoModel) => void;
  loadVaultBalanceFromServer: (vaultBalance: bigint) => void;
};

const createInitialMeleeState = (): WritableDraft<MeleeState> => ({
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
  vaultBalance: undefined,
});

export function updateRewardsRemainingAndVaultBalance(
  state: WritableDraft<ArenaState>,
  event: BrokerEventModels
) {
  if (state.arenaInfoFromServer) {
    const info = state.arenaInfoFromServer;
    if (isArenaMeleeModel(event)) {
      info.rewardsRemaining = event.melee.availableRewards;
    } else if (isArenaEnterModel(event)) {
      info.rewardsRemaining -= event.enter.matchAmount;
    } else if (isArenaExitModel(event)) {
      info.rewardsRemaining += event.exit.tapOutFee;
    } else if (isArenaVaultBalanceUpdateModel(event)) {
      if (state.vaultBalance !== undefined) {
        state.vaultBalance = event.arenaVaultBalanceUpdate.newBalance;
      }
    }
  }
}
