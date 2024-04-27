import { ReactElement } from "react";
import { SpaceProps, LayoutProps } from "styled-system";

import { Scales } from "components/inputs/input/types";

export const variants = {
  FANTOM: "fantom",
} as const;

export type Variant = (typeof variants)[keyof typeof variants];

export interface InputGroupProps extends SpaceProps, LayoutProps {
  scale?: Scales;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  children: JSX.Element;
  error?: string;
  label?: string;
  isTouched?: boolean;
  disabled?: boolean;
  isShowError?: boolean;
  variant?: Variant;
  forId?: string;
}

export interface StyledInputGroupProps extends LayoutProps {
  scale: Scales;
  hasStartIcon: boolean;
  hasEndIcon: boolean;
}

export type InputIconProps = { scale: Scales; isEndIcon?: boolean };

export type InputInnerProps = { variant?: Variant };
