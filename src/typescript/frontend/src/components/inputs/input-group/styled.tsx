import styled, { css, DefaultTheme } from "styled-components";

import { Box, Text } from "components";

import { InputGroupProps, InputIconProps, InputInnerProps, StyledInputGroupProps } from "./types";
import { Scales, scales as inputScales } from "components/inputs/input/types";

export interface ThemedProps extends Pick<InputGroupProps, "variant"> {
  theme: DefaultTheme;
}
const getPadding = (scale: Scales, hasIcon: boolean) => {
  if (!hasIcon) {
    return "16px";
  }

  switch (scale) {
    case inputScales.SM:
      return "32px";
    case inputScales.LG:
      return "56px";
    case inputScales.MD:
      return "48px";
  }
};

export const variantStyles = ({ theme, variant }: ThemedProps) => {
  return {
    fantom: css`
      display: flex;
      align-items: center;

      ${Text} {
        font-family: ${({ theme }) => theme.fonts.pixelar};
        text-transform: uppercase;
        font-family: ${theme.fonts.pixelar};
        color: ${theme.colors.lightGrey};
        margin-bottom: 0;
      }

      input {
        border: unset;

        &:focus:not(:disabled) {
          border: unset;
        }

        &:hover:not(:disabled) {
          border: unset;
        }
      }
    `,
  }[variant!];
};

export const StyledInputGroup = styled(Box)<StyledInputGroupProps>`
  input {
    padding-left: ${({ hasStartIcon, scale }) => getPadding(scale, hasStartIcon)};
    padding-right: ${({ hasEndIcon, scale }) => getPadding(scale, hasEndIcon)};
  }
`;

export const InputIcon = styled.div<InputIconProps>`
  align-items: center;
  display: flex;
  height: 100%;
  position: absolute;
  top: 0;

  ${({ isEndIcon, scale }) =>
    isEndIcon
      ? css`
          right: ${scale === inputScales.SM ? "8px" : "16px"};
        `
      : css`
          left: ${scale === inputScales.SM ? "8px" : "16px"};
        `}
`;

export const InputError = styled(Text)`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.error};
  white-space: pre-wrap;
`;

export const InputWrapper = styled.div`
  position: relative;
`;

export const InputInner = styled.div<InputInnerProps>`
  ${variantStyles};
`;
