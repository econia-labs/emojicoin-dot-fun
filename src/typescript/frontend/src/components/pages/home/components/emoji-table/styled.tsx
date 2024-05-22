import styled from "styled-components";
import { layout, type LayoutProps } from 'styled-system'

export const StyledTHWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledTH = styled.div<LayoutProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  margin: 5px 30px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    flex-direction: row;
    border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
    border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
    padding: 0 20px;
    margin: 0 30px;
  }
  
  ${layout}
`;

export const StyledTHFilters = styled.div`
  display: flex;
  align-items: baseline;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 8px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    width: unset;
    margin-bottom: unset;
  }
`;

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  padding: 0 30px;
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 259px);
  width: fit-content;
  max-width: 100%;
  gap: 1px 0;
`;
