import { SvgProps } from "components/svg/types";
import React, { ChangeEventHandler, ReactNode } from "react";
import { SpaceProps } from "styled-system";

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
