import { useMemo } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { FormattedNumber } from "@/components/FormattedNumber";
import Popup from "@/components/popup";
import Text from "@/components/text";

import { XprPopup } from "./xprPopup";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

const getXPR = (x: number, tvlPerLpCoinGrowth: number) => (tvlPerLpCoinGrowth ** x - 1) * 100;

const formatXPR = (time: number, bigDailyTvl: number) => {
  if (bigDailyTvl === 0) {
    return <Emoji emojis={emoji("hourglass not done")} />;
  }
  const xprIn = getXPR(time, bigDailyTvl);

  return <FormattedNumber value={xprIn} style="fixed" suffix="%" decimals={4} />;
};

export const DprCell = ({ dailyTvlPerLPCoinGrowth }: { dailyTvlPerLPCoinGrowth: string }) => {
  const [bigDailyTvl, dpr, wpr, apr] = useMemo(() => {
    const bigDailyTvl = Number(dailyTvlPerLPCoinGrowth);
    return [
      bigDailyTvl,
      formatXPR(1, bigDailyTvl),
      formatXPR(DAYS_IN_WEEK, bigDailyTvl),
      formatXPR(DAYS_IN_YEAR, bigDailyTvl),
    ];
  }, [dailyTvlPerLPCoinGrowth]);
  return (
    <Popup
      content={
        bigDailyTvl === 0 ? (
          <div>
            <span>{"Please wait until this pool has existed for at"}</span>
            <br />
            <span>{"least one day to view its percentage returns."}</span>
          </div>
        ) : (
          <XprPopup dpr={dpr} wpr={wpr} apr={apr} />
        )
      }
    >
      <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
        {dpr}
      </Text>
    </Popup>
  );
};
