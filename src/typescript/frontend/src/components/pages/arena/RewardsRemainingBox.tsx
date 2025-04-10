import { FormattedNumber } from "@/components/FormattedNumber";
import { useMatchBreakpoints } from "@/hooks/index";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";

import { Box } from "./utils";

export default function RewardsRemainingBox() {
  const rewardsRemaining = useRewardsRemaining();
  const { isMobile } = useMatchBreakpoints();

  return (
    <Box className="grid grid-rows-[auto_1fr] place-items-center p-[1em]">
      <div
        className={`uppercase ${isMobile ? "text-2xl" : "text-3xl"} text-light-gray tracking-widest text-center`}
      >
        {"Rewards remaining"}
      </div>
      <div
        className={`uppercase font-forma ${isMobile ? "text-4xl" : "text-6xl lg:text-7xl xl:text-8xl"} text-white`}
      >
        <FormattedNumber value={rewardsRemaining} nominalize scramble />
      </div>
    </Box>
  );
}
