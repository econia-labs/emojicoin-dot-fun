import { cn } from "lib/utils/class-name";
import { useMemo } from "react";
import type { ClassNameValue } from "tailwind-merge";

import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import type { MarketStateModel, UserEscrow } from "@/sdk/index";
import { q64ToBig } from "@/sdk/index";

import { ifEscrowTernary } from "../../../utils";
import { FormattedNominalNumber } from "../../utils";

export function EscrowAptValue({
  escrow,
  market0,
  market1,
  loading,
}: {
  escrow: UserEscrow;
  market0?: MarketStateModel;
  market1?: MarketStateModel;
  loading?: boolean;
}) {
  const amount = useMemo(() => {
    if (market0 === undefined || market1 === undefined) return undefined;
    return ifEscrowTernary(
      escrow,
      BigInt(
        q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
          .mul(escrow.emojicoin0.toString())
          .round()
          .toString()
      ),
      BigInt(
        q64ToBig(market1.lastSwap.avgExecutionPriceQ64)
          .mul(escrow.emojicoin1.toString())
          .round()
          .toString()
      )
    );
  }, [escrow, market0, market1]);

  return <AptDisplay amount={amount} loading={loading} className="text-6xl" />;
}

export function AptDisplay({
  amount,
  loading,
  className,
}: {
  amount: bigint | undefined;
  loading?: boolean;
  className?: ClassNameValue;
}) {
  return amount === undefined || loading ? (
    <AnimatedLoadingBoxes numSquares={4} />
  ) : (
    <FormattedNominalNumber
      className={cn("font-forma text-5xl text-white", className)}
      value={amount}
      suffix=" APT"
    />
  );
}
