import type {
  Colors,
  Fonts,
  FontWeight,
  Gradients,
  Radii,
  Shadows,
  Transitions,
  ZIndices,
} from "./types";

export { appearanceAnimationMap, appearanceAnimationVariants, scaleAnimation } from "./animations";
export { darkColors } from "./colors";
export interface CustomTheme {
  siteWidth: number;
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
