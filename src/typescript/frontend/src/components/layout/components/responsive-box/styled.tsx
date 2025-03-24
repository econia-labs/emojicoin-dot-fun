import { Box } from "@containers";
import styled from "styled-components";

import { aspectRatio } from "./theme";
import type { ResponsiveBoxProps } from "./types";

export const ResponsiveBoxWrapper = styled(Box)<ResponsiveBoxProps>`
  position: relative;

  &::before {
    content: "";
    display: block;
    ${aspectRatio}
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;
