import { tailwindBreakpoints } from "../../tailwind.config";

// Will remove this after refactoring pools page with new EcTable
export const mediaQueries = {
  sm: `@media screen and (min-width: ${tailwindBreakpoints.sm})`,
  md: `@media screen and (min-width: ${tailwindBreakpoints.md})`,
  lg: `@media screen and (min-width: ${tailwindBreakpoints.lg})`,
  xl: `@media screen and (min-width: ${tailwindBreakpoints.xl})`,
} as const;

export const shadows = {
  tooltip: "0px 40px 64px -12px rgba(0, 0, 0, 0.02), 0px 32px 48px -8px rgba(0, 0, 0, 0.08)",
  dropdown: "0px 0px 30px rgba(202, 199, 226, 0.5)",
} as const;

export const gradients = {
  bannerSlider: "linear-gradient(90deg, #0D0D0D 31.11%, rgba(0, 0, 0, 0) 90.37%)",
} as const;

export const transitions = {
  default: "all 0.3s ease",
} as const;

export const radii = {
  xSmall: "3px",
  small: "6px",
  semiMedium: "8px",
  medium: "16px",
  circle: "50%",
} as const;

export const zIndices = {
  modal: 1000,
  tooltip: 101,
  header: 100,
  dropdown: 10,
} as const;

export const fontWeight = {
  bold: 900,
  regular: 400,
} as const;

export const fonts = {
  pixelar: "var(--font-pixelar)",
  forma: "var(--font-forma)",
  formaM: "var(--font-formaM)",
  formaDR: "var(--font-formaDR)",
} as const;

const theme = {
  mediaQueries,
  shadows,
  radii,
  zIndices,
  fonts,
  fontWeight,
  gradients,
  transitions,
};

export default theme;
