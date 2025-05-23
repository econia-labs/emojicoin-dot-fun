import { useEventStore } from "context/event-store-context";
import { motion } from "framer-motion";

import { useMatchBreakpoints } from "@/hooks/index";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";

import { useLiveMatchAmount } from "../../arena/tabs/enter-tab/MatchAmount";

export default function GetMatchedEarlyMessage() {
  const { isMobile } = useMatchBreakpoints();
  const rewardsRemaining = useRewardsRemaining();
  const arenaInfo = useEventStore((s) => s.arenaInfoFromServer);
  const { durationPercentage } = useLiveMatchAmount(
    rewardsRemaining,
    arenaInfo,
    null, // Doesn't affect duration percentage.
    0n // Doesn't affect duration percentage.
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
