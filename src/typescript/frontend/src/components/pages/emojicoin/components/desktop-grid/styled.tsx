import styled from "styled-components";
import { Flex } from "@/containers";

export const StyledContentWrapper = styled.div`
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledContentInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1362px;
`;

export const StyledContentColumn = styled(Flex)`
  display: flex;

  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledContentHeader = styled.div`
  display: flex;
  min-height: 45px;
  align-items: center;
  position: relative;
  padding: 0 21px;

  &:after,
  &:before {
    content: "";
    display: block;
    position: absolute;
    width: 100vw;
    background-color: ${({ theme }) => theme.colors.darkGrey};
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
    border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
  }
`;
