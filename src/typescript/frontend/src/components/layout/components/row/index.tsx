import styled from "styled-components";
import { Flex } from "../flex";

import { RowProps } from "../types";

export const Row = styled(Flex)<RowProps>`
  width: 100%;
  flex-wrap: wrap;
`;

export const RowBetween = styled(Row)<RowProps>`
  justify-content: space-between;
`;
