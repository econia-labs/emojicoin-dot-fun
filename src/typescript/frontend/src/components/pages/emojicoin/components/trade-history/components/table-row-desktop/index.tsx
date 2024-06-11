"use client";

import React from "react";

import { useTooltip } from "hooks";

import { Flex } from "@containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { ExplorerLinkCustom } from "./styled";
import { toNominalPrice } from "@sdk/utils/nominal-price";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item }) => {
  const { targetRef, tooltip } = useTooltip(
    <Text color="black" textScale="pixelHeading4" textTransform="uppercase">
      {item.emoji}
    </Text>,
    {
      placement: "top",
    }
  );

  return (
    <Tr hover={true}>
      <Td width={{ _: "12.5%", laptopL: "13%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex px="12px">
          <Text textScale="bodySmall" color="lightGray" textTransform="uppercase" ref={targetRef}>
            {item.rankIcon}
          </Text>
          {tooltip}
        </Flex>
      </Td>

      <Td width={{ _: "12.5%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGray" textTransform="uppercase">
            {toCoinDecimalString(item.apt, 3)}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "23%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGray" textTransform="uppercase">
            {toCoinDecimalString(item.emoji, 3)}
          </Text>
        </Flex>
      </Td>

      <Td
        style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}
        width={{ _: "12.5%", laptopL: "6%" }}
        minWidth={{ _: "10px", laptopL: "unset" }}
      >
        <Flex>
          <Text
            textScale="bodySmall"
            color={item.type === "sell" ? "error" : "green"}
            textTransform="uppercase"
          >
            {item.type}
          </Text>
        </Flex>
      </Td>

      <Td width="22.5%" minWidth={{ _: "100px", laptopL: "unset" }} className="ml-[10px]">
        <Flex>
          <Text textScale="bodySmall" color="lightGray" textTransform="uppercase">
            {item.date.toLocaleString()}
          </Text>
        </Flex>
      </Td>
      <Td width="12.5%" minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            className="ml-[-19px]"
          >
            {toNominalPrice(item.price).toFixed(7)}
          </Text>
        </Flex>
      </Td>
      <Td width={{ _: "20%", laptopL: "16.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex justifyContent="end" className="trade-entry">
          <ExplorerLinkCustom style={{ display: "inline-block" }} value={item.version} type="txn">
            <Text textScale="bodySmall" color="lightGray" textTransform="uppercase">
              {item.version}
            </Text>
          </ExplorerLinkCustom>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
