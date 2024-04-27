import styled from "styled-components";

import { Box } from "components";
import { variantStyles } from "./theme";

import { animation, SkeletonProps, variant as VARIANT } from "./types";

const StyledSkelton = styled(Box)<SkeletonProps>`
  background-color: ${({ theme }) => theme.colors.lightGrey};
  border-radius: ${({ variant, theme }) => (variant === VARIANT.CIRCLE ? theme.radii.circle : theme.radii.small)};

  min-height: 14px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    min-height: 18px;
  }
  ${({ theme }) => theme.mediaQueries.laptop} {
    min-height: 20px;
  }

  ${({ animation }) => variantStyles(animation)};
`;

StyledSkelton.defaultProps = {
  variant: VARIANT.RECT,
  animation: animation.PULSE,
};

export default StyledSkelton;
