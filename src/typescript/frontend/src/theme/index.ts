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
export { darkColors } from "./colors";
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
