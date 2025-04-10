import Big from "big.js";
import { motion } from "framer-motion";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { formatNumberString } from "lib/utils/format-number-string";
import { useMemo, useState } from "react";
import { useInterval } from "react-use";

import { type ArenaInfoModel, minBigInt } from "@/sdk/index";

import { FormattedNominalNumber } from "../utils";

const FORMATTED_DECIMALS = 4;

export function MatchAmount({
  lockedIn,
  mustLockIn,
  rewardsRemaining,
  arenaInfo,
  position,
  amount,
}: {
  lockedIn: boolean;
  mustLockIn: boolean;
  rewardsRemaining: bigint;
  arenaInfo: ArenaInfoModel | undefined;
  position: CurrentUserPosition | null;
  amount: bigint;
}) {
  const { matchAmount, formattedAmount } = useLiveMatchAmount(
    rewardsRemaining,
    arenaInfo,
    position,
    amount
  );

  return (
    <motion.div
      key={`live-match-amount-${formattedAmount}`}
      animate={{
        scale: lockedIn ? [1.15, 1] : 1,
        filter: lockedIn ? ["brightness(1.15)", "brightness(1)"] : "",
      }}
    >
      <FormattedNominalNumber
        className={
          // If they're locked in and there's a match amount, make it green.
          // Otherwise, if they don't have to lock in and there's a match amount being missed out on, show it as pink.
          // Otherwise, don't color it at all.
          lockedIn && matchAmount ? "text-green" : !mustLockIn && matchAmount ? "text-error" : ""
        }
        value={lockedIn ? matchAmount : 0n}
        suffix=" APT"
        decimals={FORMATTED_DECIMALS}
      />
    </motion.div>
  );
}

const DEFAULT_AMOUNT = {
  matchAmount: 0n,
  formattedAmount: 0n,
};

/**
 * Calculates the match amount based on the input and available rewards, updating on an interval.
 */
function useLiveMatchAmount(
  rewardsRemaining: bigint,
  arenaInfo: ArenaInfoModel | undefined,
  position: CurrentUserPosition | null,
  amount: bigint
) {
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 1000);

  return useMemo(() => {
    if (!arenaInfo || !rewardsRemaining) return DEFAULT_AMOUNT;
    try {
      const duration = Number(arenaInfo.duration / 1000n);
      const elapsed = now - arenaInfo.startTime.getTime();
      const remainingTime = duration - elapsed;
      if (remainingTime < 0) return DEFAULT_AMOUNT;
      const durationPercentage = Big(remainingTime / duration).mul(100);

      const rawMatchAmount = BigInt(
        Big(amount.toString())
          .mul(durationPercentage)
          .div(100)
          .mul(arenaInfo.maxMatchPercentage.toString())
          .div(100)
          .round(0)
          .toString()
      );
      const eligibleMatchAmount = arenaInfo.maxMatchAmount - (position?.matchAmount ?? 0n);
      const finalMatchAmount = minBigInt(rawMatchAmount, eligibleMatchAmount, rewardsRemaining);
      const formattedAmount = formatNumberString({
        value: finalMatchAmount,
        decimals: FORMATTED_DECIMALS,
        nominalize: true,
      });

      return {
        matchAmount: finalMatchAmount,
        formattedAmount,
      };
    } catch (_) {
      return DEFAULT_AMOUNT;
    }
  }, [rewardsRemaining, arenaInfo, position?.matchAmount, amount, now]);
}
