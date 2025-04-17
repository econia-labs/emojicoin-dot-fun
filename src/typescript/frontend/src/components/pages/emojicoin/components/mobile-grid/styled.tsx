import styled from "styled-components";

export const StyledMobileContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.darkGray};
  margin-left: 10px;
  margin-right: 10px;
  position: relative;

  &:before {
    content: "";
    display: block;
    position: absolute;
    top: -1px;
    width: 1200vw;
    background-color: ${({ theme }) => theme.colors.darkGray};
    height: 1px;
    transform: translateX(-20%);
  }
`;

export const StyledMobileContentInner = styled.div`
  display: flex;
  min-height: 320px;

  position: relative;
  &:after {
    content: "";
    display: block;
    position: absolute;
    width: 1200vw;
    background-color: ${({ theme }) => theme.colors.darkGray};
    height: 1px;
    transform: translateX(-20%);
  }

  &:after {
    bottom: -1px;
  }
`;

export const StyledMobileContentBlock = styled.div`
  display: flex;
  flex-direction: column;

  &:not(:last-child) {
    ${StyledMobileContentInner} {
      border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};
    }
  }
`;
