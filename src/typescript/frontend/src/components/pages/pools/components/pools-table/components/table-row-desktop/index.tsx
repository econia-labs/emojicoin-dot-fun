import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Flex } from "@containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";

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

      <Td p="7px 12px" width={{ _: "20%", tablet: "29%" }}>
        <Flex justifyContent="end">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            title={`${((item.tvlPerLpCoinGrowth ** 356 - 1) * 100).toFixed(4)}%`}
          >
            {((item.tvlPerLpCoinGrowth ** 356 - 1) * 100).toFixed(4)}%
          </Text>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
