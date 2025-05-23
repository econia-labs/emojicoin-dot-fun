import { useEventStore } from "context/event-store-context";
import { motion } from "framer-motion";

import { useMatchBreakpoints } from "@/hooks/index";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";
import { ONE_APT_BIGINT } from "@/sdk/index";

import { useLiveMatchAmount } from "../../arena/tabs/enter-tab/MatchAmount";

export default function LockInEarlyMessage() {
  const { isMobile } = useMatchBreakpoints();
  const rewardsRemaining = useRewardsRemaining();
  const arenaInfo = useEventStore((s) => s.arenaInfoFromServer);
  const { durationPercentage } = useLiveMatchAmount(
    rewardsRemaining,
    arenaInfo,
    null, // position can be `null` since it just affects the lower bound of the eligible match amount.
    // Ensure the simulated input amount is exactly the amount it would take to reach the max matched amount.
    // This ensures that the displayed match amount is the total max possible.
    // arenaInfo ? arenaInfo.maxMatchAmount / arenaInfo.maxMatchPercentage : 0n
    ONE_APT_BIGINT
  );

  return (
    <>
      <span
        className={`arena-pixel-heading-text text-white uppercase ${isMobile ? "text-center" : ""}`}
      >
        <span>Get matched up to </span>
        <motion.span
          key={`live-match-amount-home-${durationPercentage}`}
          className="text-ec-blue inline-block"
          animate={{ scale: [1.15, 1], filter: ["brightness(1.15)", "brightness(1)"] }}
        >
          {durationPercentage}%
        </motion.span>
        <span> of deposited APT in rewards!</span>
      </span>
    </>
  );
}
