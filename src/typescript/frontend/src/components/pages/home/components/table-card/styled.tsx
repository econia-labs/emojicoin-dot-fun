import styled from "styled-components";
import { Svg, Text } from "components";

export const StyledColoredText = styled(Text)``;

export const StyledInnerItem = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 19px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.transparent};

  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.econiaBlue};

    ${Svg} {
      g {
        path {
          fill: ${({ theme }) => theme.colors.econiaBlue};
        }
      }
    }

    ${StyledColoredText} {
      color: ${({ theme }) => theme.colors.econiaBlue};
    }
  }
`;

export const StyledItemWrapper = styled.div`
  width: 100%;
  max-width: 259px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:after {
    content: "";
    display: block;
    width: 200vw;
    background-color: ${({ theme }) => theme.colors.darkGrey};
    height: 1px;
    transform: translateX(-50%);
  }

  ${({ theme }) => theme.mediaQueries.tablet} {
    width: 33%;

    &:nth-of-type(n + 2) {
      border-left: none;
    }

    &:nth-of-type(n + 7) {
      &:after {
        display: none;
      }
    }

    &:nth-of-type(3n + 4) {
      border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
    }
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    width: 20%;

    &:after {
      display: none;
    }

    &:nth-of-type(n + 2) {
      border-left: none;
    }

    &:nth-of-type(5n + 6) {
      border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
    }

    &:nth-of-type(5n - 2) {
      &:after {
        content: "";
        display: block;
        width: 200vw;
        background-color: ${({ theme }) => theme.colors.darkGrey};
        height: 1px;
        transform: translateX(-50%);
      }
    }

    &:nth-of-type(n + 16) {
      &:after {
        display: none;
      }
    }
  }
`;
