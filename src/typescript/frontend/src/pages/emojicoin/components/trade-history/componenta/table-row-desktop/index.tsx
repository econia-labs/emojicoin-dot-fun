import React from "react";

import { Flex, Text } from "components";

import { Tr, Td } from "../../styled";
import { TableRowDesktopProps } from "./types";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item }) => {
  return (
    <Tr>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.rank}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.apt}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.emoji}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.type}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.date}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex justifyContent="end">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.transaction}
          </Text>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
