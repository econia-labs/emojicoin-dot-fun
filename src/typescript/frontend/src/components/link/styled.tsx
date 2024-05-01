import styled from "styled-components";
import { layout, space } from "styled-system";
import { Link } from "react-router-dom";

import Text from "components/text";

import { LinkProps } from "./types";

export const StyledLink = styled(Text)<LinkProps>`
  display: flex;
  align-items: center;
  width: fit-content;
  color: ${({ theme, color }) => (color ? theme.colors[color] : theme.colors.white)};
  text-decoration: ${({ underline }) => (underline ? "underline" : "none")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.blue};
  }

  ${layout}
  ${space}
`;

export const RouterLink = styled(Link)<{ underline?: string }>`
  &:hover {
    text-decoration: ${({ underline }) => {
      return underline ? "underline" : "none";
    }};
  }
`;
