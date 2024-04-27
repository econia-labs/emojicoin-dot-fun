import styled from "styled-components";

export const StyledTHWrapper = styled.div`
  display: flex;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledTH = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  margin: 0 74px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
  padding: 12px 33px;
`;

export const StyledTHFilters = styled.div`
  display: flex;
`;

export const StyledWrapper = styled.div`
  display: flex;
  padding: 0 74px;
  margin-bottom: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledInner = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
`;
