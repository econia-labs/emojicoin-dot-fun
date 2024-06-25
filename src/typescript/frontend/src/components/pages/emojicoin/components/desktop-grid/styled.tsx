import styled from "styled-components";
import { Flex } from "@containers";

export const StyledContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};
`;

export const StyledContentInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1362px;
`;

export const StyledContentColumn = styled(Flex)`
  display: flex;

  border-left: 1px solid ${({ theme }) => theme.colors.darkGray};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGray};
`;

export const StyledContentHeader = styled.div`
  display: flex;
  min-height: 45px;
  align-items: center;
  position: relative;
  padding: 0 21px;
  width: 100%;

  &:after,
  &:before {
    content: "";
    display: block;
    position: absolute;
    width: 200vw;
    background-color: ${({ theme }) => theme.colors.darkGray};
    height: 1px;
    transform: translateX(-50%);
  }

  &:after {
    top: 0;
  }

  &:before {
    bottom: 0;
  }
`;

export const StyledBlockWrapper = styled.div`
  display: flex;
  justify-content: center;
  min-height: 320px;
  height: 100%;
`;

export const StyledBlock = styled(Flex)`
  display: flex;
  flex-direction: column;

  &:first-child {
    border-right: 1px solid ${({ theme }) => theme.colors.darkGray};
  }
`;
