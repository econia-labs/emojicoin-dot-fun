import styled from "styled-components";
import { Flex } from "@containers";

export const StyledPoolsPage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 93px;
  flex-grow: 1;

  ${({ theme }) => theme.mediaQueries.laptopL} {
    max-height: calc(100vh - 200px);
  }
`;

export const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1362px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGray};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGray};
  margin-left: 30px;
  margin-right: 30px;

  ${({ theme }) => theme.mediaQueries.laptopL} {
    flex-direction: row;
    margin-left: 0;
    margin-right: 0;
  }
`;

export const StyledHeader = styled.div`
  display: flex;
  width: 100%;
  min-height: 34px;
  border-top: 1px solid ${({ theme }) => theme.colors.darkGray};
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};
  justify-content: center;
  padding-left: 30px;
  padding-right: 30px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    min-height: 45px;
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    padding-left: 0;
    padding-right: 0;
  }
`;

export const StyledHeaderInner = styled.div`
  display: flex;
  align-items: center;
  max-width: 1362px;
  width: 100%;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGray};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGray};
  padding: 0 21px;
`;

export const StyledInner = styled(Flex)`
  position: relative;

  &:before {
    content: "";
    display: block;
    position: absolute;
    width: 120vw;
    background-color: ${({ theme }) => theme.colors.darkGray};
    height: 1px;
    transform: translateX(-10%);
    bottom: -1px;
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    &:last-child {
      border-left: 1px solid ${({ theme }) => theme.colors.darkGray};
    }
  }
`;

export const StyledSubHeader = styled.div`
  display: flex;
  padding-left: 30px;
  padding-right: 30px;
  width: 100%;
  height: 33px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};

  ${({ theme }) => theme.mediaQueries.tablet} {
    height: 43px;
  }
`;
