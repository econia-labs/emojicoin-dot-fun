import { type SvgProps } from "components/svg/types";
import { type ChangeEventHandler, type ReactNode } from "react";
import type React from "react";
import { type SpaceProps } from "styled-system";

export interface CheckboxProps extends SpaceProps {
  label?: string | React.ReactNode;
  checked: boolean;
  icon?: ReactNode & SvgProps;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export type CheckProps = {
  checked: boolean;
  disabled?: boolean;
};
