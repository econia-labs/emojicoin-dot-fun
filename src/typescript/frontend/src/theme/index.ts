export { darkColors, lightColors } from "./colors";
export { default as dark } from "./dark";
export { default as light } from "./light";
export { appearanceAnimationVariants, appearanceAnimationMap, scaleAnimation } from "./animations";

import {
  Breakpoints,
  Colors,
  Fonts,
  FontWeight,
  MediaQueries,
  Radii,
  Shadows,
  ZIndices,
  Gradients,
  Transitions,
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
