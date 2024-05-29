import styled from "styled-components";

export const StyledMobileContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.darkGray};
  margin-left: 30px;
  margin-right: 30px;
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

export const StyledMobileContentHeader = styled.div`
  display: flex;
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGray};
  padding: 3px 10px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    min-height: 45px;
    align-items: center;
  }

  &:after,
  &:before {
    content: "";
    display: block;
    position: absolute;
    width: 1200vw;
    background-color: ${({ theme }) => theme.colors.darkGray};
    height: 1px;
    transform: translateX(-20%);
  }

  &:after {
    top: -1px;
  }

  &:before {
    bottom: -1px;
  }
`;
