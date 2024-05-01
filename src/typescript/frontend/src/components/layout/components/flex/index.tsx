import styled from "styled-components";
import { flexbox } from "styled-system";

import { Box } from "../container";
import { FlexGapProps, FlexProps } from "../types";
import { gap } from "./theme";

export const Flex = styled(Box)<FlexProps>`
  display: flex;
  ${flexbox}
`;

export const FlexGap = styled(Flex)<FlexGapProps>`
  ${gap}
`;
