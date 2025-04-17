import { useMemo } from "react";

import { useArenaPhaseStore } from "../phase/store";

export default function useArenaLoadingInfo() {
  const snapshot = useArenaPhaseStore((s) => s.snapshot);

  const info = useMemo(() => {
    if (!snapshot) return null;
    const { functionName, meleeInfo, position } = snapshot;
    const endTime = meleeInfo.startTime.getTime() + Number(meleeInfo.duration / 1000n);

    if (Date.now() > endTime) return "Starting a new melee";

    switch (functionName) {
      case "Enter":
        return position?.open ? "Topping off" : "Entering";
      case "Exit":
        return position?.open && position?.lockedIn ? "Tapping out" : "Exiting";
      case "Swap": {
        if (!position) {
          console.error("Position should always be defined while swapping.");
          return null;
        }
        const [s0, s1] = [
          meleeInfo.emojicoin0Symbols.join(""),
          meleeInfo.emojicoin1Symbols.join(""),
        ];
        const [from, to] = position.emojicoin0Balance ? [s0, s1] : [s1, s0];
        return { from, to };
      }
      default:
        return null;
    }
  }, [snapshot]);

  return info
    ? typeof info === "string"
      ? { text: info, from: undefined, to: undefined }
      : { text: "Swapping", from: info.from, to: info.to }
    : { text: undefined, from: undefined, to: undefined };
}
