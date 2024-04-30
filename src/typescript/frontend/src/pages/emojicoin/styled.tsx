import styled from "styled-components";

export const StyledContentWrapper = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 60%;
  border-left: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-right: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledContentHeader = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledBlockWrapper = styled.div`
  display: flex;
  justify-content: center;
  min-height: 320px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledInput = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.darkGrey};
`;

export const StyledArrowWrapper = styled.div`
  display: flex;
  border-radius: ${({ theme }) => theme.radii.circle};
  border: 1px solid ${({ theme }) => theme.colors.darkGrey};
  padding: 12px;
  width: 37px;
  height: 37px;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translateY(-50%) translateX(-50%);
  background-color: ${({ theme }) => theme.colors.black};
`;
