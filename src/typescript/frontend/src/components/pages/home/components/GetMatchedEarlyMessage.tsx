import type { ClassValue } from "clsx";
import { useEventStore } from "context/event-store-context";
import { motion } from "framer-motion";
import { cn } from "lib/utils/class-name";

import useRewardsRemaining from "@/hooks/use-rewards-remaining";

import { useLiveMatchAmount } from "../../arena/tabs/enter-tab/MatchAmount";

export default function GetMatchedEarlyMessage({ className }: { className?: ClassValue }) {
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
      <span className={cn("arena-pixel-heading-text uppercase text-white", className)}>
        <span>Get matched up to </span>
        <motion.span
          key={`live-match-amount-home-${durationPercentage}`}
          className="inline-block text-ec-blue"
          animate={{ scale: [1.15, 1], filter: ["brightness(1.15)", "brightness(1)"] }}
        >
          {durationPercentage}%
        </motion.span>
        <span> of deposited APT in rewards!</span>
      </span>
    </>
  );
}
