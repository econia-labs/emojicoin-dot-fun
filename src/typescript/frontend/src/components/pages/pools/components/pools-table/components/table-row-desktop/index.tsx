import React, { useMemo } from "react";
import { useMatchBreakpoints } from "hooks";
import { Flex } from "@containers";
import { Text, Tr, Td } from "components";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { XprPopup } from "./XprPopup";
import { Emoji } from "utils/emoji";
import Link from "next/link";
import Popup from "components/popup";
import { emojiNamesToPath } from "utils/pathname-helpers";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

// prettier-ignore
export const getXPR = (x: number, tvlPerLpCoinGrowth: number) =>
  ((tvlPerLpCoinGrowth ** x) - 1) * 100;

export const formatXPR = (time: number, bigDailyTvl: number) => {
  const xpr = getXPR(time, bigDailyTvl);
  const matchTrailingZeros = /(\.0*|(?<=(\..*))0*)$/;
  const xprStr = xpr.toFixed(4).replace(matchTrailingZeros, "");
  return `${xprStr}%`;
};

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item, selected, onClick }) => {
  const { isMobile } = useMatchBreakpoints();
  const bigDailyTvl = Number(item.dailyTvlPerLPCoinGrowth);

  const dpr = useMemo(() => formatXPR(1, bigDailyTvl), [bigDailyTvl]);
  const wpr = useMemo(() => formatXPR(DAYS_IN_WEEK, bigDailyTvl), [bigDailyTvl]);
  const apr = useMemo(() => formatXPR(DAYS_IN_YEAR, bigDailyTvl), [bigDailyTvl]);

  return (
    <Tr hover selected={selected} onClick={onClick}>
      <Td p="7px 12px" width={{ _: "25%", tablet: "11.5%" }}>
        <Popup content="go to market">
          <Link href={`/market/${emojiNamesToPath(item.market.emojis.map((e) => e.name))}`}>
            <Flex justifyContent="space-between" className="cursor-pointer">
              <div className="font-pixelar font-sm text-ec-blue">{"{"}</div>
              <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
                <Emoji emojis={item.market.emojis} />
              </Text>
              <div className="font-pixelar font-sm text-ec-blue">{"}"}</div>
            </Flex>
          </Link>
        </Popup>
      </Td>

      <Td p="7px 12px" width={{ _: "30%", tablet: "26.5%" }}>
        <Flex>
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={`${toCoinDecimalString(item.state.cumulativeStats.quoteVolume, 2)} APT`}
          >
            {toCoinDecimalString(item.state.cumulativeStats.quoteVolume, 2)} APT
          </Text>
        </Flex>
      </Td>

      {!isMobile && (
        <Td p="7px 12px" width="18%">
          <Flex>
            <Text
              textScale="bodySmall"
              color="lightGray"
              textTransform="uppercase"
              ellipsis
              title={`${toCoinDecimalString(item.dailyVolume, 2)} APT`}
            >
              {toCoinDecimalString(item.dailyVolume, 2)} APT
            </Text>
          </Flex>
        </Td>
      )}

      <Td p="7px 12px" width={{ _: "25%", tablet: "20%" }}>
        <Flex>
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={`${toCoinDecimalString(item.state.cpammRealReserves.quote * 2n, 2)} APT`}
          >
            {toCoinDecimalString(item.state.cpammRealReserves.quote * 2n, 2)} APT
          </Text>
        </Flex>
      </Td>

      <Td p="7px 12px" width={{ _: "20%", tablet: "24%" }}>
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
                <XprPopup {...{ dpr, wpr, apr }} />
              )
            }
          >
            <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
              {dpr}
            </Text>
          </Popup>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
