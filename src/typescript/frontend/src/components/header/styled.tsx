import styled from "styled-components";
import { scaleAnimation } from "theme";

export const StyledContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.black};
  position: fixed;
  top: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  width: 100%;
`;

export const StyledClickItem = styled.div`
  width: fit-content;
  ${scaleAnimation}
`;
