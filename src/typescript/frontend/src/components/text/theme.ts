import { css, DefaultTheme } from "styled-components";
import { system, Config } from "styled-system";

import { scales } from "./types";
import { fontWeight } from "theme/base";
import { FontWeight } from "theme/types";

export const styles = (theme: DefaultTheme) => {
  return {
    [scales.pixelDisplay1]: css`
      font-family: ${theme.fonts.pixelar};
      font-size: 128px;
      line-height: 160px;
    `,
    [scales.display1]: css`
      font-size: 95px;
      line-height: 96px;
    `,
    [scales.display2]: css`
      font-size: 64px;
      line-height: 64px;
    `,
    [scales.display3]: css`
      font-size: 48px;
      line-height: 65px;
    `,
    [scales.display4]: css`
      font-size: 28px;
      line-height: 48px;
    `,
    [scales.display5]: css`
      font-size: 20px;
      line-height: 48px;
    `,
    [scales.display6]: css`
      font-size: 15px;
      line-height: 20px;
    `,
    [scales.pixelHeading1]: css`
      font-size: 64px;
      line-height: 48px;
      font-family: ${theme.fonts.pixelar};
    `,
    [scales.pixelHeading2]: css`
      font-size: 40px;
      line-height: 50px;
      font-family: ${theme.fonts.pixelar};
    `,
    [scales.pixelHeading3]: css`
      font-size: 32px;
      line-height: 40px;
      font-family: ${theme.fonts.pixelar};
    `,
    [scales.pixelHeading4]: css`
      font-size: 20px;
      line-height: 25px;
      font-family: ${theme.fonts.pixelar};
    `,
    [scales.heading1]: css`
      font-size: 28px;
      line-height: 18px;
    `,
    [scales.heading2]: css`
      font-size: 20px;
      line-height: 18px;
    `,
    [scales.bodyLarge]: css`
      font-size: 16px;
      line-height: 18px;
    `,
    [scales.bodySmall]: css`
      font-size: 12px;
      line-height: 18px;
    `,
    [scales.bodyXSmall]: css`
      font-size: 10px;
      line-height: 18px;
    `,
  };
};

const config: Config = {
  $fontWeight: {
    property: "fontWeight",
    transform: (value: keyof FontWeight) => {
      return fontWeight[value];
    },
  },
};

export const fontWeights = system(config);
