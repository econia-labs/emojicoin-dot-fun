import styled from "styled-components";
import { clearfixDisplayNone } from "styles";
import { Box } from "@/containers";
import { sliderAutoplay } from "./animations";

export const StyledSliderWrapper = styled(Box)`
  width: 100%;
  position: relative;

  &::before,
  &::after {
    ${clearfixDisplayNone}
    width: 16.875rem;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: ${({ theme }) => theme.zIndices.dropdown - 1};
    transition: ${({ theme }) => theme.transitions.default};

    ${({ theme }) => theme.mediaQueries.tablet} {
      display: block;
    }

    ${({ theme }) => theme.mediaQueries.largeHeight} {
      width: ${({ theme }) => `calc((150vw - ${theme.siteWidth}px) / 2)`};
    }
  }

  &::after {
    left: auto;
    right: 0;
    transform: scale(-1);
  }
`;

export const StyledClientsWrapper = styled(Box)`
  overflow: hidden;
  position: relative;
  width: 100%;
`;

export const StyledClientsWrapperIn = styled(Box)`
  display: flex;
  gap: 16px;
  height: 40px;
  animation: ${sliderAutoplay} 24s linear infinite;
`;

export const StyledClientsItem = styled(Box)`
  align-items: center;
  display: flex;
  justify-content: center;
  height: 40px;
  min-width: fit-content;
  gap: 16px;
`;
