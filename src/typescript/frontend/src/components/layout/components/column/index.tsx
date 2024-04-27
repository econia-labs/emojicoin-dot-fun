import styled from "styled-components";

import { Flex } from "../flex";

import { ColumnProps } from "../types";

export const Column = styled(Flex)<ColumnProps>`
  flex-direction: column;
`;
