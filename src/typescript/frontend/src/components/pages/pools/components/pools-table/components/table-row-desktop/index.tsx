import { Td, Tr } from "components";
import { FormattedNumber } from "components/FormattedNumber";
import Popup from "components/popup";
import { cn } from "lib/utils/class-name";
import { toCoinDecimalString } from "lib/utils/decimals";
import Link from "next/link";
import React, { useMemo } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { emojiNamesToPath } from "utils/pathname-helpers";

import { Flex } from "@/containers";

import type { TableRowDesktopProps } from "./types";
import { XprPopup } from "./XprPopup";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

// prettier-ignore
const getXPR = (x: number, tvlPerLpCoinGrowth: number) =>
  ((tvlPerLpCoinGrowth ** x) - 1) * 100;

const formatXPR = (time: number, bigDailyTvl: number) => {
  if (bigDailyTvl === 0) {
    return <Emoji emojis={emoji("hourglass not done")} />;
  }
  const xprIn = getXPR(time, bigDailyTvl);

  return <FormattedNumber value={xprIn} style="fixed" suffix="%" decimals={4} />;
};

const tdClassName = "py-2 px-3 body-sm text-light-gray uppercase ellipses";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item, selected, onClick }) => {
  const bigDailyTvl = Number(item.dailyTvlPerLPCoinGrowth);

  const { dpr, wpr, apr } = useMemo(
    () => ({
      dpr: formatXPR(1, bigDailyTvl),
      wpr: formatXPR(DAYS_IN_WEEK, bigDailyTvl),
      apr: formatXPR(DAYS_IN_YEAR, bigDailyTvl),
    }),
    [bigDailyTvl]
  );

  return (
    <Tr hover selected={selected} onClick={onClick}>
      <Td className="w-1/4 px-3 py-2 md:w-[11.5%]">
        <Popup content="go to market">
          <Link href={`/market/${emojiNamesToPath(item.market.emojis.map((e) => e.name))}`}>
            <Flex justifyContent="space-between" className="cursor-pointer">
              <div className="font-sm font-pixelar text-ec-blue">{"{"}</div>
              <p className="uppercase text-light-gray body-sm ellipses">
                <Emoji emojis={item.market.emojis} />
              </p>
              <div className="font-sm font-pixelar text-ec-blue">{"}"}</div>
            </Flex>
          </Link>
        </Popup>
      </Td>

      <Td
        className={cn(tdClassName, "w-[30%] md:w-[26.5%]")}
        title={`${toCoinDecimalString(item.state.cumulativeStats.quoteVolume, 2)} APT`}
      >
        <FormattedNumber value={item.state.cumulativeStats.quoteVolume} suffix=" APT" nominalize />
      </Td>

      <Td
        className={cn(tdClassName, "hidden w-[18%] md:table-cell")}
        title={`${toCoinDecimalString(item.dailyVolume, 2)} APT`}
      >
        <FormattedNumber value={item.dailyVolume} suffix=" APT" nominalize />
      </Td>

      <Td
        className={cn(tdClassName, "w-1/4 md:w-[20%]")}
        title={`${toCoinDecimalString(item.state.cpammRealReserves.quote * 2n, 2)} APT`}
      >
        <FormattedNumber value={item.state.cpammRealReserves.quote * 2n} suffix=" APT" nominalize />
      </Td>

      <Td className={cn(tdClassName, "w-1/5 md:w-[24%]")}>
        <Flex justifyContent="start" className="relative">
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
            <p>{dpr}</p>
          </Popup>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
