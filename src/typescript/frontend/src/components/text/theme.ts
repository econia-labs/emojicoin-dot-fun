import { system, type Config } from "styled-system";

import { scales } from "./types";
import { fontWeight } from "theme/base";
import { type FontWeight } from "theme/types";

export const textStyles = (k: keyof typeof scales) => {
  const st = {
    [scales.pixelDisplay1]: `
      font-family: var(--font-pixelar);
      font-size: 128px;
      line-height: 160px;
    `,
    [scales.display1]: `
      font-size: 95px;
      line-height: 96px;
      font-family: var(--font-formaM);
    `,
    [scales.display2]: `
      font-size: 64px;
      line-height: 64px;
      font-family: var(--font-formaM);
    `,
    [scales.display3]: `
      font-size: 48px;
      line-height: 65px;
      font-family: var(--font-formaM);
    `,
    [scales.display4]: `
      font-size: 28px;
      line-height: 48px;
      font-family: var(--font-forma);
    `,
    [scales.display5]: `
      font-size: 20px;
      line-height: 48px;
      font-family: var(--font-forma);
    `,
    [scales.display6]: `
      font-size: 15px;
      line-height: 20px;
      font-family: var(--font-forma);
    `,
    [scales.pixelHeading1]: `
      font-size: 64px;
      line-height: 48px;
      font-family: var(--font-pixelar);
    `,
    [scales.pixelHeading1b]: `
      font-size: 52px;
      line-height: 48px;
      font-family: var(--font-pixelar);
    `,
    [scales.pixelHeading2]: `
      font-size: 40px;
      line-height: 50px;
      font-family: var(--font-pixelar);
    `,
    [scales.pixelHeading3]: `
      font-size: 32px;
      line-height: 40px;
      font-family: var(--font-pixelar);
    `,
    [scales.pixelHeading4]: `
      font-size: 20px;
      line-height: 25px;
      font-family: var(--font-pixelar);
    `,
    [scales.heading1]: `
      font-size: 28px;
      line-height: 18px;
      font-family: var(--font-formaM);
    `,
    [scales.heading2]: `
      font-size: 20px;
      line-height: 18px;
      font-family: var(--font-formaM);
    `,
    [scales.bodyLarge]: `
      font-size: 16px;
      line-height: 18px;
      font-family: var(--font-forma);
    `,
    [scales.bodySmall]: `
      font-size: 12px;
      line-height: 18px;
      font-family: var(--font-forma);
    `,
    [scales.bodyXSmall]: `
      font-size: 10px;
      line-height: 18px;
      font-family: var(--font-forma);
    `,
  };

  return st[k];
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
