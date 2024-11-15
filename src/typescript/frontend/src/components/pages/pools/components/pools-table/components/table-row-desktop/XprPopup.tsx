import { type ReactNode } from "react";
import { Big } from "big.js";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

// prettier-ignore
export const getXPR = (x: number, tvlPerLpCoinGrowth: Big) =>
  Big(tvlPerLpCoinGrowth)
    .pow(x)
    .sub(Big(1))
    .mul(Big(100));

export const formatXPR = (time: number, bigDailyTvl: Big) => {
  if (bigDailyTvl.eq(Big(0))) {
    return <Emoji emojis={emoji("hourglass not done")} />;
  }
  const xprIn = getXPR(time, bigDailyTvl);
  const xpr = xprIn.toFixed(4);
  return `${xpr.replace(/(\.0*|(?<=(\..*))0*)$/, "")}%`;
};

export const XprPopup = ({ bigDailyTvl }: { bigDailyTvl: Big }): ReactNode => {
  return bigDailyTvl.eq(Big(0)) ? (
    <div className="leading-5 text-black !font-forma text-md">
      <span>{"Please wait until this pool has existed for at"}</span>
      <br />
      <span>{"least one day to view its percentage returns."}</span>
    </div>
  ) : (
    [
      <div className="font-pixelar pixel-heading-4 leading-5 text-black uppercase" key="DPR">
        <div className="flex gap-[0.2rem] justify-between">
          <span>DPR:</span>
          <span>{formatXPR(1, bigDailyTvl)}</span>
        </div>
      </div>,
      <div className="font-pixelar pixel-heading-4 leading-5 text-black uppercase" key="WPR">
        <div className="flex gap-[0.2rem] justify-between">
          <span>WPR:</span>
          <span>{formatXPR(DAYS_IN_WEEK, bigDailyTvl)}</span>
        </div>
      </div>,
      <div className="font-pixelar pixel-heading-4 leading-5 text-black uppercase" key="APR">
        <div className="flex gap-[0.2rem] justify-between">
          <span>APR:</span>
          <span>{formatXPR(DAYS_IN_YEAR, bigDailyTvl)}</span>
        </div>
      </div>,
    ]
  );
};

export default formatXPR;
