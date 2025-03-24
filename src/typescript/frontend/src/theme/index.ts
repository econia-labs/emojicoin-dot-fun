import {
  type Breakpoints,
  type Colors,
  type Fonts,
  type FontWeight,
  type Gradients,
  type MediaQueries,
  type Radii,
  type Shadows,
  type Transitions,
  type ZIndices,
} from "./types";

export { appearanceAnimationMap, appearanceAnimationVariants, scaleAnimation } from "./animations";
export { darkColors, lightColors } from "./colors";
export { default as dark } from "./dark";
export { default as light } from "./light";

export interface CustomTheme {
  siteWidth: number;
  breakpoints: Breakpoints;
  mediaQueries: MediaQueries;
  shadows: Shadows;
  radii: Radii;
  zIndices: ZIndices;
  fontWeight: FontWeight;
  colors: Colors;
  isDark: boolean;
  fonts: Fonts;
  gradients: Gradients;
  transitions: Transitions;
}
