import styled from "styled-components";
import { space, typography } from "styled-system";

import { type TextareaProps } from "./types";

export const Textarea = styled.textarea<TextareaProps>`
  height: 45px;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-family: ${({ theme }) => theme.fonts.forma};
  display: block;
  resize: none;
  font-size: 16px;
  font-weight: 600;
  outline: 0;
  padding: 10px 18px;
  width: 100%;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.darkGrey};

  &::-webkit-scrollbar {
    display: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.white};
    opacity: 0.6;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.darkGrey};
    box-shadow: none;
    color: ${({ theme }) => theme.colors.darkGrey}24;
    cursor: not-allowed;
    border: none;
  }

  ${typography}
  ${space}
`;
