// cspell:word unsized
import React from "react";
import { useMatchBreakpoints } from "hooks";
import { Flex, FlexGap } from "@containers";
import { Text, Tr, Td } from "components";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import Popup from "components/popup";
import { Big } from "big.js";
import type { UnsizedDecimalString } from "@sdk/emojicoin_dot_fun";
import { SYMBOL_DATA } from "@sdk/emoji_data";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

const getXPR = (x: number, tvlPerLpCoinGrowth: UnsizedDecimalString) =>
  (Big(tvlPerLpCoinGrowth).gte(Big(1)) ? Big(tvlPerLpCoinGrowth) : Big(1))
    .pow(x)
    .sub(Big(1))
    .mul(Big(100));

const formatXPR = (xprIn: Big) => {
  const xpr = xprIn.toFixed(4);
  return `${xpr.replace(/(\.0*|(?<=(\..*))0*)$/, "")}%`;
};

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item, selected, onClick }) => {
  const { isMobile } = useMatchBreakpoints();

  return (
    <Tr hover selected={selected} onClick={onClick}>
      <Td p="7px 12px" width={{ _: "25%", tablet: "11.5%" }}>
        <Flex justifyContent="start">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={item.market.symbolData.symbol.toUpperCase()}
          >
            {item.market.symbolData.symbol}
          </Text>
        </Flex>
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
          {item.dailyTvlPerLPCoinGrowth === "0" || !item.dailyTvlPerLPCoinGrowth ? (
            <Popup
              content={
                <Text
                  textScale="pixelHeading4"
                  lineHeight="20px"
                  color="black"
                  textTransform="uppercase"
                >
                  The market is too recent. Cannot predict APR yet.
                </Text>
              }>
              <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
                {SYMBOL_DATA.byName("hourglass not done")!.emoji}
              </Text>
            </Popup>
          ) : (
            <Popup
              content={[
                <Text
                  textScale="pixelHeading4"
                  lineHeight="20px"
                  color="black"
                  textTransform="uppercase"
                  key={"DPR"}
                >
                  <FlexGap gap=".2rem" justifyContent="space-between">
                    <span>DPR:</span>
                    <span>{formatXPR(getXPR(1, item.dailyTvlPerLPCoinGrowth))}</span>
                  </FlexGap>
                </Text>,
                <Text
                  textScale="pixelHeading4"
                  lineHeight="20px"
                  color="black"
                  textTransform="uppercase"
                  key={"WPR"}
                >
                  <FlexGap gap=".2rem" justifyContent="space-between">
                    <span>WPR:</span>
                    <span>{formatXPR(getXPR(DAYS_IN_WEEK, item.dailyTvlPerLPCoinGrowth))}</span>
                  </FlexGap>
                </Text>,
                <Text
                  textScale="pixelHeading4"
                  lineHeight="20px"
                  color="black"
                  textTransform="uppercase"
                  key={"APR"}
                >
                  <FlexGap gap=".2rem" justifyContent="space-between">
                    <span>APR:</span>
                    <span>{formatXPR(getXPR(DAYS_IN_YEAR, item.dailyTvlPerLPCoinGrowth))}</span>
                  </FlexGap>
                </Text>,
              ]}
            >
              <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
                {formatXPR(getXPR(1, item.dailyTvlPerLPCoinGrowth))}
              </Text>
            </Popup>
          )}
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
