import { type StateEventData } from "@sdk/indexer-v2/types";
import { getBondingCurveProgress } from "@sdk/utils";
import { Progress } from "components/ui/progress";

export const MiniBondingCurveProgress = ({ state }: { state: StateEventData }) => {
  const progress = getBondingCurveProgress(state.clammVirtualReserves.quote);
  return progress === 100 ? (
    <span className="lowercase opacity-55">exited</span>
  ) : (
    <Progress className="h-[7px] w-full" value={progress} max={100} />
  );
};
