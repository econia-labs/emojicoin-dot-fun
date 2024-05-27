"use client";

import React from "react";

import { useTooltip } from "hooks";

import { Flex } from "@/containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { truncateAddress } from "@/sdk/utils/misc";
import { toDecimalsAPT } from "lib/utils/decimals";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item }) => {
  const { targetRef, tooltip } = useTooltip(
    <Text color="black" textScale="pixelHeading4" textTransform="uppercase">
      {item.emoji}
    </Text>,
    {
      placement: "top",
    },
  );

  return (
    <Tr>
      <Td width={{ _: "12.5%", laptopL: "13%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex px="12px">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ref={targetRef}>
            {item.rankIcon}
          </Text>
          {tooltip}
        </Flex>
      </Td>

      <Td width={{ _: "12.5%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {toDecimalsAPT(item.apt, 3)}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "23%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {toDecimalsAPT(item.emoji, 3)}
          </Text>
        </Flex>
      </Td>

      <Td
        style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}
        width={{ _: "12.5%", laptopL: "13%" }}
        minWidth={{ _: "10px", laptopL: "unset" }}
      >
        <Flex>
          <Text textScale="bodySmall" color={item.type === "sell" ? "error" : "green"} textTransform="uppercase">
            {item.type}
          </Text>
        </Flex>
      </Td>

      <Td width="20%" minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.date.toLocaleString()}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "20%", laptopL: "35%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex justifyContent="end">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {truncateAddress(item.transaction)}
          </Text>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
