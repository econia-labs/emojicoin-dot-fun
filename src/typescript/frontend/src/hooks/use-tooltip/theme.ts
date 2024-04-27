import { DefaultTheme } from "styled-components";

export const getTooltipStyles = (theme: DefaultTheme) => {
  return {
    tooltip: {
      padding: 0,
      border: "none",
      borderRadius: theme.radii.medium,
      maxWidth: "unset",
    },
    arrow: {
      display: "none",
    },
  };
};
