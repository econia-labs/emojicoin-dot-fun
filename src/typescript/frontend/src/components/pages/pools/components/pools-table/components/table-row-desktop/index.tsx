import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Flex, FlexGap } from "@containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";

import Popup from "components/popup";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

const getXPR = (x: number, tvlPerLpCoinGrowth: number) => (tvlPerLpCoinGrowth ** x - 1) * 100;

const formatXPR = (xpr: number) => {
  return `${xpr.toFixed(4).replace(/(\.0*|(?<=(\..*))0*)$/, "")}%`;
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
            title={item.symbol.toUpperCase()}
          >
            {item.symbol}
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
            title={`${toCoinDecimalString(item.allTimeVolume, 2)} APT`}
          >
            {toCoinDecimalString(item.allTimeVolume, 2)} APT
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
            title={`${toCoinDecimalString(item.cpammRealReservesQuote * 2, 2)} APT`}
          >
            {toCoinDecimalString(item.cpammRealReservesQuote * 2, 2)} APT
          </Text>
        </Flex>
      </Td>

      <Td p="7px 12px" width={{ _: "20%", tablet: "24%" }}>
        <Flex justifyContent="start" className="relative">
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
                  <span>{formatXPR(getXPR(1, item.tvlPerLpCoinGrowth))}</span>
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
                  <span>{formatXPR(getXPR(DAYS_IN_WEEK, item.tvlPerLpCoinGrowth))}</span>
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
                  <span>{formatXPR(getXPR(DAYS_IN_YEAR, item.tvlPerLpCoinGrowth))}</span>
                </FlexGap>
              </Text>,
            ]}
          >
            <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
              {formatXPR(getXPR(1, item.tvlPerLpCoinGrowth))}
            </Text>
          </Popup>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
