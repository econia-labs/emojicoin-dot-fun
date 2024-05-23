import styled from "styled-components";
import { Svg } from "components/svg";

export const StyledInputWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.colors.darkGrey};
  border-radius: ${({ theme }) => theme.radii.xSmall};
  padding: 7px 18px;
  align-items: center;
  height: 55px;

  ${({ theme }) => theme.mediaQueries.tablet} {
    align-items: unset;
  }
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
  cursor: pointer;

  &:active {
    ${Svg} {
      path {
        fill: ${({ theme }) => theme.colors.econiaBlue};
      }
    }
  }

  ${({ theme }) => theme.mediaQueries.laptopL} {
    &:hover {
      ${Svg} {
        path {
          fill: ${({ theme }) => theme.colors.econiaBlue};
        }
      }
    }
  }
`;

export const StyledInputContainer = styled.div<{ isForce: boolean }>`
  display: flex;
  position: relative;
  gap: 19px;
  flex-direction: ${({ isForce }) => (isForce ? "column" : "column-reverse")};
`;
