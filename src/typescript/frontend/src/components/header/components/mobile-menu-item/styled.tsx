import styled from "styled-components";

export const StyledItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.darkGrey};
  width: 100%;
  padding-left: 9px;
  padding-right: 9px;
`;
