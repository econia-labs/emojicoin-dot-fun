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
  width: 259px;
  max-width: 259px;
  box-shadow:
    -0.5px 0 0 ${({ theme }) => theme.colors.darkGrey},
    0.5px 0 0 ${({ theme }) => theme.colors.darkGrey};

  &:after {
    content: "";
    display: block;
    width: 200vw;
    background-color: ${({ theme }) => theme.colors.darkGrey};
    height: 1px;
    transform: translateX(-50%);
  }
`;
