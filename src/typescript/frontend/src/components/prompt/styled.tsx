import styled from "styled-components";

export const Arrow = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${({ theme }) => theme.colors.econiaBlue};
  bottom: -5px;
  left: 50%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.econiaBlue};
  border-right: 1px solid ${({ theme }) => theme.colors.econiaBlue};
  transform: rotate(45deg);
`;

export const StyledPrompt = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? "flex" : "none")};
  z-index: 1;
  width: 100%;
  position: absolute;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.econiaBlue};
  border-radius: ${({ theme }) => theme.radii.small};
  bottom: calc(100% + 20px);
`;
