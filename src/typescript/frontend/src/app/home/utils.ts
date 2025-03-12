import { toTotalAptLocked } from "@sdk/indexer-v2/types";
import { type HomePageProps } from "./HomePage";

export const toAptLockedFromProps = (meleeData: Exclude<HomePageProps["meleeData"], null>) =>
  toTotalAptLocked({
    market0: {
      state: meleeData.market0.state,
      locked: meleeData.melee.emojicoin0Locked,
    },
    market1: {
      state: meleeData.market1.state,
      locked: meleeData.melee.emojicoin1Locked,
    },
  });
