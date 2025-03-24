import type {
  Breakpoints,
  Colors,
  Fonts,
  FontWeight,
  Gradients,
  MediaQueries,
  Radii,
  Shadows,
  Transitions,
  ZIndices,
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
