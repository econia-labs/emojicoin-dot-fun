import styled from "styled-components";

export const StyledBorder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 285px;
  height: 285px;
  transform: translateX(-82%);

  &::before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 285px;
    height: 285px;
    border: 12px solid ${({ theme }) => theme.colors.econiaBlue};
    box-shadow:
      inset 0 0 56px 4px ${({ theme }) => theme.colors.econiaBlue},
      0 0 22px 10px ${({ theme }) => theme.colors.econiaBlue};
    border-radius: ${({ theme }) => theme.radii.circle};
    filter: blur(2px);
  }
`;
