import Svg from "components/svg/Svg";
import styled from "styled-components";

export const StyledIcon = styled.div`
  cursor: pointer;

  &:hover {
    ${Svg} {
      circle {
        fill: ${({ theme }) => theme.colors.econiaBlue};
      }
    }
  }
`;
