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
  width: 100%;
  border: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.darkGray};
    opacity: 0.8;
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.darkGray};
    box-shadow: none;
    color: ${({ theme }) => theme.colors.darkGray}24;
    cursor: not-allowed;
    border: none;
  }

  &.home-textarea {
    padding-top: 12px !important;
  }

  @media screen and (min-width: 768px) {
    &.home-textarea {
      padding-top: 11px !important;
    }
  }

  @media screen and (min-width: 1024px) {
    &.home-textarea {
      padding-top: 9px !important;
    }
  }

  @media screen and (min-width: 1440px) {
    &.home-textarea {
      padding-top: 4px !important;
    }
  }

  ${typography}
  ${space}
`;
