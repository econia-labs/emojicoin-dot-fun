import styled from "styled-components";

import Svg from "components/svg/Svg";

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
