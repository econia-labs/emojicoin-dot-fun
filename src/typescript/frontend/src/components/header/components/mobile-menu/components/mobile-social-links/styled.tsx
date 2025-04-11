import Svg from "components/svg/Svg";
import styled from "styled-components";

export const StyledIcon = styled.div`
  cursor: pointer;
  ${Svg} {
    circle {
      stroke: ${({ theme }) => theme.colors.econiaBlue};
      fill: ${({ theme }) => theme.colors.black};
    }
    path {
      fill: ${({ theme }) => theme.colors.econiaBlue};
    }
  }

  &:hover {
    ${Svg} {
      circle {
        stroke: ${({ theme }) => theme.colors.black};
        fill: ${({ theme }) => theme.colors.econiaBlue};
      }
      path {
        fill: ${({ theme }) => theme.colors.black};
      }
    }
  }
`;
