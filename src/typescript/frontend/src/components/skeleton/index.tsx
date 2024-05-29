import styled from "styled-components";

import { Box } from "@containers";
import { variantStyles } from "./theme";

import { animation as animation$1, type SkeletonProps, variant as VARIANT } from "./types";

const StyledSkeleton = styled(Box).attrs<SkeletonProps>(
  ({ variant = VARIANT.RECT, animation = animation$1.PULSE }) => ({
    variant,
    animation,
  }),
)`
  background-color: ${({ theme }) => theme.colors.lightGray};
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

export default StyledSkeleton;
