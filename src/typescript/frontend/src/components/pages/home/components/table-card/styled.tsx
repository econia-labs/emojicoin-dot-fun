import { Arrow } from "components/svg";
import Text from "components/text";
import styled from "styled-components";
import { darkColors } from "theme/colors";

export const StyledItemWrapper = styled.div`
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

export const StyledInnerItem = styled.div<{ isEmpty: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 19px;
  position: relative;
  overflow: hidden;
  cursor: ${({ isEmpty }) => !isEmpty && "pointer"};
  border: 1px solid ${({ theme }) => theme.colors.transparent};

  ${StyledItemWrapper}:hover & {
    border: 1px solid ${darkColors.econiaBlue};
  }
`;

export const StyledColoredText = styled(Text)`
  border: 1px solid ${({ theme }) => theme.colors.transparent};

  ${StyledItemWrapper}:hover & {
    color: var(--econia-blue);
  }
`;

export const StyledArrow = styled(Arrow)`
  width: 21px;

  ${StyledItemWrapper}:hover & {
    g {
      path {
        fill: ${darkColors.econiaBlue};
      }
    }
  }
`;
