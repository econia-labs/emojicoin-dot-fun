import styled from "styled-components";
import { layout, opacity, shadow, space, typography, variant } from "styled-system";

import { scaleVariants, variantStyles } from "./theme";
import type { ButtonProps } from "./types";

const StyledButton = styled.button<ButtonProps>`
  background-color: ${({ theme }) => theme.colors.transparent};
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-family: ${({ theme }) => theme.fonts.pixelar};
  text-transform: uppercase;
  position: relative;
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  outline: 0;
  transition: all 0.3s ease;
  width: fit-content;

  ${variant({
    prop: "scale",
    variants: scaleVariants,
  })};

  ${variantStyles};

  ${space}
  ${typography}
  ${layout}
  ${opacity}
  ${shadow}
`;

export default StyledButton;
