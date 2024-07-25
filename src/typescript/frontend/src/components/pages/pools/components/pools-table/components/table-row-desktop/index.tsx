import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Flex } from "@containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";

const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;

const getXPR = (x: number, tvlPerLpCoinGrowth: number) => (tvlPerLpCoinGrowth ** x - 1) * 100;

const LOWER_CUT_OFF = -50;
const UPPER_CUT_OFF = 100;

const formatXPR = (xpr: number, title: boolean = false) => {
  if (xpr > UPPER_CUT_OFF) {
    if (title) {
      return "lfg";
    }
    return "🤯";
  }
  if (xpr < LOWER_CUT_OFF) {
    if (title) {
      return "cry more";
    }
    return "😭";
  }
  return `${xpr.toFixed(4)}%`;
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

      <Td p="7px 12px" width={{ _: "25%", tablet: "15%" }}>
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

      <Td p="7px 12px" width={{ _: "10%", tablet: "14%" }}>
        <Flex justifyContent="end">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={formatXPR(getXPR(DAYS_IN_YEAR, item.tvlPerLpCoinGrowth), true)}
          >
            {formatXPR(getXPR(DAYS_IN_YEAR, item.tvlPerLpCoinGrowth))}
          </Text>
        </Flex>
      </Td>

      <Td p="7px 12px" width={{ _: "10%", tablet: "15%" }}>
        <Flex justifyContent="end">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={formatXPR(getXPR(DAYS_IN_WEEK, item.tvlPerLpCoinGrowth), true)}
          >
            {formatXPR(getXPR(DAYS_IN_WEEK, item.tvlPerLpCoinGrowth))}
          </Text>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
