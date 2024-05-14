import {
  type mediaQueries,
  type shadows,
  type radii,
  type zIndices,
  type fontWeight,
  type fonts,
  type breakpoints,
  type gradients,
  type transitions,
} from "./base";
import { type baseColors, type darkColors } from "./colors";

export type MediaQueries = typeof mediaQueries;

export type Breakpoints = typeof breakpoints;

export type Radii = typeof radii;

export type Shadows = typeof shadows;

export type FontWeight = typeof fontWeight;

export type Fonts = typeof fonts;

export type ZIndices = typeof zIndices;

export type BaseColors = {
  [property in keyof typeof baseColors]: string;
};

export type CustomColors = {
  [property in keyof typeof darkColors]: string;
};

export interface Colors extends BaseColors, CustomColors {}

export type Gradients = typeof gradients;

export type Transitions = typeof transitions;
