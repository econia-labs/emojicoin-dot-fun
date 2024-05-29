import styled from "styled-components";
import Text from "components/text";
import Svg from "components/svg/Svg";

export const StyledBtn = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.darkGray};
  cursor: pointer;
  gap: 12px;

  &:hover {
    ${Text} {
      color: ${({ theme }) => theme.colors.econiaBlue};
    }

    ${Svg} {
      path {
        fill: ${({ theme }) => theme.colors.econiaBlue};
      }
    }
  }
`;
