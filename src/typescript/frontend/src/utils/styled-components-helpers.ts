import isPropValid from "@emotion/is-prop-valid";
import { ResponsiveValue } from "styled-system";

import { breakpointMap } from "theme/base";

import { StyledTarget } from "styled-components/dist/types";

// In new v6 version of styled-components shouldForwardProp is no longer provided by default
export const shouldForwardProp = (propName: string, target: StyledTarget<"web">) => {
  if (typeof target === "string") {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }
  // For other elements, forward all props
  return true;
};

const createMediaQuery = (n: number) => `@media screen and (min-width: ${n}px)`;

type BreakPointsKeys = keyof typeof breakpointMap;

type ObjectForStyles = {
  [key: string]: object;
};

export const getStylesFromResponsiveValue = <T extends string>(
  rawStyles: ResponsiveValue<T>,
  objForStyles: ObjectForStyles,
) => {
  let cssString = "";

  if (typeof rawStyles === "string") {
    const newStyle = rawStyles && rawStyles in objForStyles && objForStyles[rawStyles as string];
    cssString += newStyle;
  } else if (rawStyles instanceof Object) {
    for (const key in rawStyles) {
      const typedKey = key as BreakPointsKeys | "_";
      const breakpoint = typedKey in breakpointMap ? breakpointMap[typedKey as BreakPointsKeys] : undefined;
      const value = rawStyles[key] as T;

      const newStyle = value && value in objForStyles && objForStyles[value];

      if (!breakpoint) {
        cssString += `${newStyle}\n`;
      } else {
        const media = createMediaQuery(breakpoint);
        cssString += `${media} {\n`;
        cssString += `${newStyle}\n`;
        cssString += `}\n`;
      }
    }
  }

  return cssString.replace(/,/g, "");
};
