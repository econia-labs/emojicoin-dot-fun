import styled from "styled-components";

export const StyledTradeHistory = styled.div`
  width: 100%;
  height: 100%;
  overflow-x: auto;

  &::-webkit-scrollbar-track {
    border-top: 1px solid ${({ theme }) => theme.colors.darkGray};
  }
`;
