import Svg from "components/svg/Svg";
import { css, type DefaultTheme } from "styled-components";

import { type ButtonProps, scales } from "./types";

interface ThemedProps extends ButtonProps {
  theme: DefaultTheme;
}

const svgStyle = (color: string) => css`
  ${Svg} {
    fill: ${color};
    circle {
      fill: transparent;
      stroke: transparent;
    }
  }
`;

export const variantStyles = ({ theme, color, variant, isLoading, fakeDisabled }: ThemedProps) => {
  return {
    solid: css`
      color: ${color ? theme.colors[color] : theme.colors.black};
      padding: 8px 12px;
      border-radius: 4px;
      background-color: ${theme.colors.econiaBlue};

      ${svgStyle(theme.colors.black)}

      ${fakeDisabled &&
      css`
        color: ${!isLoading && theme.colors.black};
        background-color: ${!isLoading && theme.colors.darkGray};
      `}

      &:disabled {
        color: ${!isLoading && theme.colors.black};
        cursor: not-allowed;
        background-color: ${!isLoading && theme.colors.darkGray};
      }
    `,
    border: css`
      padding: 8px 12px;
      border: 1px dashed ${theme.colors.econiaBlue};
      border-radius: 4px;
      background-color: ${theme.colors.transparent};
      color: ${color ? theme.colors[color] : theme.colors.econiaBlue};
      ${!fakeDisabled &&
      css`
        &:not([disabled]):hover {
          color: ${theme.colors.econiaBlue};
        }
      `}

      ${svgStyle(theme.colors.econiaBlue)}

      ${fakeDisabled &&
      css`
        color: ${!isLoading && theme.colors.darkGray};
        cursor: not-allowed;
        border: 1px dashed ${theme.colors.darkGray};

        ${svgStyle(!isLoading ? theme.colors.darkGray : theme.colors.econiaBlue)}
      `}

      &:disabled {
        color: ${!isLoading && theme.colors.darkGray};
        cursor: not-allowed;
        border: 1px dashed ${theme.colors.darkGray};

        ${svgStyle(!isLoading ? theme.colors.darkGray : theme.colors.econiaBlue)}
      }
    `,
    outline: css`
      background-color: ${theme.colors.transparent};
      color: ${color ? theme.colors[color] : theme.colors.econiaBlue};
      ${svgStyle(theme.colors.econiaBlue)}

      ${!fakeDisabled &&
      css`
        &:not([disabled]):hover {
          color: ${theme.colors.econiaBlue};
        }
      `}

      ${fakeDisabled &&
      css`
        color: ${!isLoading && theme.colors.darkGray};
        ${svgStyle(!isLoading ? theme.colors.darkGray : theme.colors.econiaBlue)}
      `}

      &:disabled {
        color: ${!isLoading && theme.colors.darkGray};
        cursor: not-allowed;

        ${svgStyle(!isLoading ? theme.colors.darkGray : theme.colors.econiaBlue)}
      }
    `,
  }[variant!];
};

export const scaleVariants = {
  [scales.SMALL]: {
    padding: "4px",
    minWidth: 74,
    fontSize: 20,
    lineHeight: "125%",
  },
  [scales.LARGE]: {
    padding: "4px",
    minWidth: 100,
    fontSize: 24,
    lineHeight: "125%",
  },
};
