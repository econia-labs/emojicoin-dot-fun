import styled, { css } from "styled-components";
import { space, typography } from "styled-system";
import { InputProps, scales, ThemedProps, BorderProps } from "./types";

const getHeight = ({ scale }: ThemedProps) => {
  switch (scale) {
    case scales.SM:
      return "32px";
    case scales.LG:
      return "48px";
    case scales.MD:
      return "44px";
  }
};

export const getBorderStyles = ({ error, isTouched, borderColor, theme }: BorderProps) => {
  if (error && isTouched) {
    return css`
      border: 1px solid ${theme.colors.darkGrey};
      &:focus {
        border: 1px solid ${theme.colors.darkGrey} !important;
      }
      &:hover {
        border: 1px solid ${theme.colors.darkGrey} !important;
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
    border: 1px solid ${theme.colors.darkGrey};
  `;
};

export const Input = styled.input<InputProps>`
  background-color: transparent;
  border-radius: ${({ theme }) => theme.radii.xSmall};
  color: ${({ theme }) => theme.colors.white};
  font-family: ${({ theme }) => theme.fonts.forma};
  display: block;
  font-size: 16px;
  font-weight: 600;
  height: ${getHeight};
  outline: 0;
  padding: 0 14px;
  width: 100%;

  &::placeholder {
    color: ${({ theme }) => theme.colors.darkGrey};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.lightGrey};
    box-shadow: none;
    color: ${({ theme }) => theme.colors.darkGrey}24;
    cursor: not-allowed;
    border: none;
  }

  &:focus:not(:disabled) {
    border: 1px solid ${({ theme }) => theme.colors.darkGrey};
  }

  &:hover:not(:disabled) {
    border: 1px solid ${({ theme }) => theme.colors.darkGrey};
  }
  ${getBorderStyles}

  ${typography}
  ${space}
`;

Input.defaultProps = {
  scale: "md",
};
