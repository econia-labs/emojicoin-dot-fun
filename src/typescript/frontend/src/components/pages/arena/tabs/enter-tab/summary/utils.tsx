import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { cn } from "lib/utils/class-name";
import { useMemo } from "react";
import type { ClassNameValue } from "tailwind-merge";

import type { MarketStateModel } from "@/sdk/index";
import { q64ToBig } from "@/sdk/index";

import { marketTernary } from "../../../utils";
import { FormattedNominalNumber } from "../../utils";

export function EscrowAptValue({
  position,
  market0,
  market1,
  loading,
}: {
  position: CurrentUserPosition;
  market0?: MarketStateModel;
  market1?: MarketStateModel;
  loading?: boolean;
}) {
  const amount = useMemo(() => {
    if (market0 === undefined || market1 === undefined) return undefined;
    return marketTernary(
      position,
      BigInt(
        q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
          .mul(position.emojicoin0Balance.toString())
          .round()
          .toString()
      ),
      BigInt(
        q64ToBig(market1.lastSwap.avgExecutionPriceQ64)
          .mul(position.emojicoin1Balance.toString())
          .round()
          .toString()
      )
    );
  }, [position, market0, market1]);

  return <AptDisplay amount={amount} loading={loading} className="text-6xl" />;
}

export function AptDisplay({
  amount,
  loading,
  className,
  scramble,
}: {
  amount: bigint | undefined;
  loading?: boolean;
  className?: ClassNameValue;
  scramble?: boolean;
}) {
  return amount === undefined || loading ? (
    <span className={cn("font-forma text-5xl text-light-gray", className)}>--</span>
  ) : (
    <FormattedNominalNumber
      className={cn("font-forma text-5xl text-white", className)}
      value={amount}
      suffix=" APT"
      scramble={scramble}
    />
  );
}
