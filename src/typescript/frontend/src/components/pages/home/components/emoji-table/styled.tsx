import styled from "styled-components";

export const StyledTHWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledTH = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  margin: 5px 20px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    flex-direction: row;
    border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
    border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
    padding: 0 20px;
    margin: 0 28px;
    max-width: 777px;
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    margin: 0 73px;
    max-width: 1295px;
  }
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

  ${({ theme }) => theme.mediaQueries.tablet} {
    padding: 0 24px;
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    padding: 0 74px;
  }
`;

export const StyledInner = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: center;

  ${({ theme }) => theme.mediaQueries.tablet} {
    flex-direction: row;
    max-width: 999px;
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    max-width: 1295px;
  }
`;
