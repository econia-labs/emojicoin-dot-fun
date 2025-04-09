import Svg from "components/svg/Svg";
import Text from "components/text";
import styled from "styled-components";

export const StyledBtn = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.darkGray};
  cursor: pointer;
  gap: 12px;
  height: fit-content;

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
