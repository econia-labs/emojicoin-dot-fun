import type {
  breakpoints,
  fonts,
  fontWeight,
  gradients,
  mediaQueries,
  radii,
  shadows,
  transitions,
  zIndices,
} from "./base";
import type { baseColors, darkColors } from "./colors";

export type MediaQueries = typeof mediaQueries;

export type Breakpoints = typeof breakpoints;

export type Radii = typeof radii;

export type Shadows = typeof shadows;

export type FontWeight = typeof fontWeight;

export type Fonts = typeof fonts;

export type ZIndices = typeof zIndices;

type BaseColors = {
  [property in keyof typeof baseColors]: string;
};

type CustomColors = {
  [property in keyof typeof darkColors]: string;
};

export interface Colors extends BaseColors, CustomColors {}

export type Gradients = typeof gradients;

export type Transitions = typeof transitions;
