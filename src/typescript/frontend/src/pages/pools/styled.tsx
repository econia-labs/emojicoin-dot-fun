import styled from "styled-components";
import { Flex } from "components";

export const StyledPoolsPage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 120px;
  flex-grow: 1;
  max-height: calc(100vh - 200px);
`;

export const StyledWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  max-width: 1362px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledHeader = styled.div`
  display: flex;
  width: 100%;
  min-height: 45px;
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
  justify-content: center;
`;

export const StyledHeaderInner = styled.div`
  display: flex;
  align-items: center;
  max-width: 1362px;
  width: 100%;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
  padding: 0 21px;
`;

export const StyledInner = styled(Flex)`
  position: relative;

  &:before {
    content: "";
    display: block;
    position: absolute;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.darkGrey};
    height: 1px;
    transform: translateX(-50%);
  }

  &:before {
    bottom: 0;
  }
`;
