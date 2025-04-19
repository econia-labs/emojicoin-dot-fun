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
      <Td className="py-2 px-3" width={{ _: "25%", tablet: "11.5%" }}>
        <Popup content="go to market">
          <Link href={`/market/${emojiNamesToPath(item.market.emojis.map((e) => e.name))}`}>
            <Flex justifyContent="space-between" className="cursor-pointer">
              <div className="font-pixelar font-sm text-ec-blue">{"{"}</div>
              <p className="body-sm text-light-gray uppercase ellipses">
                <Emoji emojis={item.market.emojis} />
              </p>
              <div className="font-pixelar font-sm text-ec-blue">{"}"}</div>
            </Flex>
          </Link>
        </Popup>
      </Td>

      <Td
        width={{ _: "30%", tablet: "26.5%" }}
        className={tdClassName}
        title={`${toCoinDecimalString(item.state.cumulativeStats.quoteVolume, 2)} APT`}
      >
        <FormattedNumber value={item.state.cumulativeStats.quoteVolume} suffix=" APT" nominalize />
      </Td>

      <Td
        className={cn(tdClassName, "xs:hidden md:table-cell")}
        width="18%"
        title={`${toCoinDecimalString(item.dailyVolume, 2)} APT`}
      >
        <FormattedNumber value={item.dailyVolume} suffix=" APT" nominalize />
      </Td>

      <Td
        width={{ _: "25%", tablet: "20%" }}
        className={tdClassName}
        title={`${toCoinDecimalString(item.state.cpammRealReserves.quote * 2n, 2)} APT`}
      >
        <FormattedNumber value={item.state.cpammRealReserves.quote * 2n} suffix=" APT" nominalize />
      </Td>

      <Td className={tdClassName} width={{ _: "20%", tablet: "24%" }}>
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
