import { type ResponsiveValue } from "styled-system";
import { breakpointMap } from "theme/base";

const createMediaQuery = (n: number) => `@media screen and (min-width: ${n}px)`;

type BreakPointsKeys = keyof typeof breakpointMap;

type ObjectForStyles = {
  [key: string]: object;
};

export const getStylesFromResponsiveValue = <T extends string>(
  rawStyles: ResponsiveValue<T>,
  objForStyles: ObjectForStyles
) => {
  let cssString = "";

  if (typeof rawStyles === "string") {
    const newStyle = rawStyles && rawStyles in objForStyles && objForStyles[rawStyles as string];
    cssString += newStyle;
  } else if (rawStyles instanceof Object) {
    for (const key in rawStyles) {
      const typedKey = key as BreakPointsKeys | "_";
      const breakpoint =
        typedKey in breakpointMap ? breakpointMap[typedKey as BreakPointsKeys] : undefined;
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
