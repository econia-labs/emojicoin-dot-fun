export { darkColors, lightColors } from "./colors";
export { default as dark } from "./dark";
export { default as light } from "./light";
export { appearanceAnimationVariants, appearanceAnimationMap, scaleAnimation } from "./animations";

import {
  type Breakpoints,
  type Colors,
  type Fonts,
  type FontWeight,
  type MediaQueries,
  type Radii,
  type Shadows,
  type ZIndices,
  type Gradients,
  type Transitions,
} from "./types";

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
