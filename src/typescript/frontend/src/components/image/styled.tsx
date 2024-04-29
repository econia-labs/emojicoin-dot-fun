import styled from "styled-components";
import { ResponsiveBox } from "components";
import { SkeletonProps } from "components/skeleton/types";

export const StyledImage = styled.img<{ variant?: SkeletonProps["variant"] }>`
  border-radius: ${({ theme, variant }) => (variant === "circle" ? theme.radii.circle : "0px")};
`;

export const StyledBackgroundImage = styled(ResponsiveBox)`
  background-repeat: no-repeat;
  background-size: contain;
`;
