import React from "react";
import { useMatchBreakpoints } from "hooks";
import { Flex } from "@containers";
import { Text, Tr, Td } from "components";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import Popup from "components/popup";
import { Big } from "big.js";
import { formatXPR, XprPopup } from "./XprPopup";
import { Emoji } from "utils/emoji";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item, selected, onClick }) => {
  const { isMobile } = useMatchBreakpoints();
  const bigDailyTvl = Big(item.dailyTvlPerLPCoinGrowth);

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
            <Emoji emojis={item.market.emojis} />
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
          <Popup content={<XprPopup bigDailyTvl={bigDailyTvl} />}>
            <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ellipsis>
              {formatXPR(1, bigDailyTvl)}
            </Text>
          </Popup>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
