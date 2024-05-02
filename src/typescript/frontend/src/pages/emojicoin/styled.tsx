import styled from "styled-components";
import { Column } from "components";

export const StyledContentWrapper = styled.div`
  display: flex;
  justify-content: center;
`;
export const StyledContentInner = styled.div`
  display: flex;
  width: 100%;
  max-width: 1362px;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledContentColumn = styled(Column)`
  display: flex;
  flex-direction: column;

  &:first-child {
    border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
  }
`;

export const StyledContentHeader = styled.div`
  display: flex;
  height: 45px;
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
`;

export const StyledBlock = styled.div`
  display: flex;
  flex-direction: column;

  &:after {
    content: "";
    display: block;
    position: absolute;
    width: 100vw;
    bottom: 0;
    background-color: ${({ theme }) => theme.colors.error};
    height: 1px;
    transform: translateX(-50%);
  }
`;
