import { SpaceProps } from "styled-system";
import { SvgProps } from "components/svg/types";
import { TextProps } from "components/text/types";

export const scales = {
  MD: "md",
  SM: "sm",
} as const;

export type Scale = (typeof scales)[keyof typeof scales];

export interface SwitcherProps extends SpaceProps {
  label?: string | React.ReactNode;
  checked: boolean;
  icon?: React.ReactNode & SvgProps;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  scale?: Scale;
  labelProps?: TextProps;
}
