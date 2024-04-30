import styled from "styled-components";
import { Text, Svg } from "components";

export const StyledBtn = styled.div`
  display: flex;
  color: ${({ theme }) => theme.colors.darkGrey};
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
