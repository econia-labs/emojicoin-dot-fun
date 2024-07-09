import styled from "styled-components";

export const Arrow = styled.div<{ top: boolean }>`
  position: absolute;
  width: 20px;
  height: 20px;
  background: ${({ theme }) => theme.colors.econiaBlue};
  bottom: ${({ top }) => (top ? "-8px" : "unset")};
  top: ${({ top }) => (top ? "unset" : "-8px")};
  left: 50%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.econiaBlue};
  border-top: 1px solid ${({ theme }) => theme.colors.econiaBlue};
  border-right: 1px solid ${({ theme }) => theme.colors.econiaBlue};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  transform: ${({ top }) => (top ? "rotate(45deg)" : "rotate(-45deg)")};
`;

export const StyledPrompt = styled.div<{ isVisible: boolean; top: boolean }>`
  display: ${({ isVisible }) => (isVisible ? "flex" : "none")};
  z-index: 1;
  width: 100%;
  position: absolute;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
  border-radius: ${({ theme }) => theme.radii.small};
  bottom: ${({ top }) => (top ? "calc(100% + 20px)" : "unset")};
  top: ${({ top }) => (!top ? "calc(100% + 20px)" : "unset")};
`;
