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
  width: 20%;
  max-width: 259px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &:nth-of-type(n + 2) {
    border-left: 0;
  }

  &:nth-of-type(n + 6) {
    border-top: 0;
  }

  &:nth-of-type(5n + 6) {
    border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  }

  &:nth-child(5n)::after {
    content: "";
    display: block;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.darkGrey};
    height: 1px;
  }

  &:nth-of-type(5n + 1)::after {
    content: "";
    display: block;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.darkGrey}; /* Line color. */
    height: 1px;
    transform: translateX(-100%);
  }
`;

export const StyledHiddenContent = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.colors.black};
  transition-delay: 0.3s;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  margin: 1px;
  opacity: 0;
  z-index: 5;
  transition: opacity 0.3s ease-in;
  text-transform: none;
  padding: 12px;
  display: flex;
  flex-direction: column;

  &:hover {
    opacity: 1;
  }
`;
