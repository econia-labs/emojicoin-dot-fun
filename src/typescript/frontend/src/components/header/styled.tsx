import styled from "styled-components";
import { scaleAnimation } from "theme";

export const StyledContainer = styled.div`
  background: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 100%);
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
