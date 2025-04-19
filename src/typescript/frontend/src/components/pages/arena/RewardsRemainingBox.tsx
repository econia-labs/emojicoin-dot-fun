import { FormattedNumber } from "@/components/FormattedNumber";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";

import { Box } from "./utils";

export default function RewardsRemainingBox() {
  const rewardsRemaining = useRewardsRemaining();

  return (
    <Box className="grid grid-rows-[auto_1fr] place-items-center p-[1em]">
      <div
        className={`uppercase xs:text-2xl md:text-3xl text-light-gray tracking-widest text-center`}
      >
        {"Rewards remaining"}
      </div>
      <div
        className={`uppercase font-forma xs:text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-white`}
      >
        <FormattedNumber value={rewardsRemaining} nominalize scramble />
      </div>
    </Box>
  );
}
