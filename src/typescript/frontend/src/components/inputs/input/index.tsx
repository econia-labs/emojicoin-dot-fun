// cspell:word istouched
import styled, { css } from "styled-components";
import { space, typography } from "styled-system";
import { type InputProps, scales, type ThemedProps, type BorderProps } from "./types";

const getHeight = ({ scale }: ThemedProps) => {
  switch (scale) {
    case scales.SM:
      return "32px";
    case scales.LG:
      return "48px";
    case scales.MD:
      return "44px";
    case scales.XM:
      return "38px";
  }
};

export const getBorderStyles = ({ error, touched, borderColor, theme }: BorderProps) => {
  if (error && touched) {
    return css`
      border: 1px solid ${theme.colors.lightGray};
      &:focus {
        border: 1px solid ${theme.colors.lightGray} !important;
      }
      &:hover {
        border: 1px solid ${theme.colors.lightGray} !important;
      }
    `;
  } else if (borderColor) {
    return css`
      border: 1px solid ${theme.colors[borderColor]};
      &:focus {
        border: 1px solid ${borderColor} !important;
      }
      &:hover {
        border: 1px solid ${borderColor} !important;
      }
    `;
  }

  return css`
    border: 1px solid ${theme.colors.lightGray};
  `;
};

export const Input = styled.input.attrs<InputProps>(({ scale = "md" }) => ({
  scale,
}))`
  background-color: transparent;
  border-radius: ${({ theme }) => theme.radii.xSmall};
  color: ${({ theme }) => theme.colors.white};
  font-family: ${({ theme }) => theme.fonts.forma};
  display: block;
  font-size: 16px;
  font-weight: 400;
  height: ${getHeight};
  outline: 0;
  padding: 0 14px;
  width: 100%;

  &::placeholder {
    color: ${({ theme }) => theme.colors.lightGray};
    opacity: 0.9;
  }

  &:disabled {
    box-shadow: none;
    color: ${({ theme }) => theme.colors.lightGray}99;
    cursor: not-allowed;
  }

  ${getBorderStyles}

  ${typography}
  ${space}

  ${({ className }) =>
    className &&
    css`
      &.${className} {
        font-family: inherit;
        font-size: inherit;
      }
    `}
`;
