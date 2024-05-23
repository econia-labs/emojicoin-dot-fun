import styled from "styled-components";
import { space, typography, layout, opacity, border, shadow, variant } from "styled-system";
import { scaleVariants, variantStyles } from "./theme";

import { type ButtonProps } from "./types";

const StyledButton = styled.button<ButtonProps>`
  background-color: ${({ theme }) => theme.colors.transparent};
  border-radius: ${({ theme }) => theme.radii.semiMedium};
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
  border: 0;

  ${variant({
    prop: "scale",
    variants: scaleVariants,
  })};

  ${variantStyles};

  ${space}
  ${typography}
  ${layout}
  ${opacity}
  ${border}
  ${shadow}
`;

export default StyledButton;
