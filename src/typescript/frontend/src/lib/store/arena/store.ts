import {
  type ArenaMeleeModel,
  type ArenaEnterModel,
  type ArenaExitModel,
  type ArenaSwapModel,
  type ArenaInfoModel,
} from "@sdk/indexer-v2";
import { type WritableDraft } from "immer";

export type MeleeState = {
  swaps: readonly ArenaSwapModel[];
  enters: readonly ArenaEnterModel[];
  exits: readonly ArenaExitModel[];
};

export type ArenaState = {
  arenaInfoFromServer?: ArenaInfoModel;
  meleeEvents: readonly ArenaMeleeModel[];
  melees: Readonly<Map<bigint, MeleeState>>;
};

export type ArenaActions = {
  loadArenaInfoFromServer: (info: ArenaInfoModel) => void;
};

export const createInitialMeleeState = (): WritableDraft<MeleeState> => ({
  swaps: [],
  enters: [],
  exits: [],
});

export const initializeArenaStore = (): ArenaState => ({
  arenaInfoFromServer: undefined,
  meleeEvents: [],
  melees: new Map(),
});
