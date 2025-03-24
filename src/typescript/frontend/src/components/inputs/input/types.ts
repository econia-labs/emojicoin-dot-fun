// cspell:word istouched

export const scales = {
  SM: "sm",
  MD: "md",
  XM: "xm",
  LG: "lg",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];
