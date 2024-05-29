import styled from "styled-components";

export const StyledButtonsWrapper = styled.div`
  display: flex;
  padding: 8px;
  justify-content: space-between;
  border-top: ${({ theme }) => `1px solid ${theme.colors.lightGray}`};
`;
