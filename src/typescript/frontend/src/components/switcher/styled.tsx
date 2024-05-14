import styled from "styled-components";

import { type Scale } from "./types";

import { styles } from "./theme";
import { space } from "styled-system";

export const StyledSwitcher = styled.label<{ checked: boolean; scale?: Scale }>`
  position: relative;
  width: ${({ scale }) => scale && styles[scale].width};
  height: ${({ scale }) => scale && styles[scale].height};
  border-radius: 10px;
  transition: all 0.3s ease-out;
`;

export const Slider = styled.span<{ checked: boolean; disabled?: boolean; scale?: Scale }>`
  // styles for checkbox background
  position: absolute;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.transparent};
  border-radius: 15px;
  transition: all 0.3s ease-out;
  border: ${({ theme }) => `1px solid ${theme.colors.darkGrey}`};
  // styles for moved check part

  &:before {
    content: "";
    position: absolute;
    right: ${({ scale }) => scale && styles[scale].positionLeft};
    bottom: ${({ scale }) => scale && styles[scale].positionLeft};
    width: ${({ scale }) => scale && styles[scale].circleWidth};
    height: ${({ scale }) => scale && styles[scale].circleWidth};
    border-radius: 100%;
    background-color: ${({ theme }) => theme.colors.lightGrey};

    transition: all 0.3s ease-out;
  }

  &:focus-visible {
    outline: none;
  }
`;

export const Checkbox = styled.input<{ checked?: boolean }>`
  visibility: hidden;
  &:focus-visible {
    outline: none;
  }
  &:checked + ${Slider}:before {
    transform: ${({ checked }) => checked && "translateX(-140%)"};
    background-color: ${({ theme }) => theme.colors.econiaBlue};
  }
`;

export const StyledCheckbox = styled.label<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  margin: 0;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  width: fit-content;

  ${space}
`;
