import { type StateEventData } from "@sdk/indexer-v2/types";
import { getBondingCurveProgress } from "@sdk/utils";
import { Progress } from "components/ui/progress";

export const MiniBondingCurveProgress = ({ state }: { state: StateEventData }) => {
  const progress = getBondingCurveProgress(state.clammVirtualReserves.quote);
  return (
    <Progress
      className={
        "h-[7px] w-full" + `${progress === 100 ? " hue-rotate-[225deg] brightness-[0.25]" : ""}`
      }
      value={progress}
      max={100}
    />
  );
};
