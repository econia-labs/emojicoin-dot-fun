import { getBondingCurveProgress } from "@sdk/utils";
import Arrow from "components/svg/icons/Arrow";
import { Progress } from "components/ui/Progress";
import { ROUTES } from "router/routes";

export const MiniBondingCurveProgress = ({
  symbol,
  clammVirtualReservesQuote,
}: {
  symbol: string;
  clammVirtualReservesQuote: bigint;
}) => {
  const progress = getBondingCurveProgress(clammVirtualReservesQuote);
  return progress < 100 ? (
    <Progress className={"h-[7px] w-full"} value={progress} max={100} />
  ) : (
    <a className="hover:underline" href={`${ROUTES.pools}?pool=${symbol}`}>
      <div className="flex flex-row justify-center gap-2">
        {"pool"}
        <Arrow color="econiaBlue" height={11} width={11} />
      </div>
    </a>
  );
};
