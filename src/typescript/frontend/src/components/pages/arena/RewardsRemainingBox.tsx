import { FormattedNumber } from "@/components/FormattedNumber";
import useRewardsRemaining from "@/hooks/use-rewards-remaining";

import { Box } from "./utils";

export default function RewardsRemainingBox() {
  const rewardsRemaining = useRewardsRemaining();

  return (
    <Box className="grid grid-rows-[auto_1fr] place-items-center p-[1em]">
      <div className={`text-center text-2xl uppercase tracking-widest text-light-gray md:text-3xl`}>
        {"Rewards remaining"}
      </div>
      <div
        className={`font-forma text-4xl uppercase text-white md:text-6xl lg:text-7xl xl:text-8xl`}
      >
        <FormattedNumber value={rewardsRemaining} nominalize scramble />
      </div>
    </Box>
  );
}
