import type { BoxProps } from "components/layout/components/types";
import type { SvgProps } from "components/svg/types";
import type { TextProps } from "components/text/types";
import type { TooltipOptions } from "hooks/use-tooltip/types";

export type Option = {
  title: string;
  value: string | number;
};

export interface SingleSelectProps extends Omit<SelectProps, "targetRef" | "tooltip"> {
  dropdownComponent: React.FC<DropdownMenuProps>;
  dropdownWrapperProps: Omit<BoxProps, "onClick">;
  tooltipOptions?: TooltipOptions;
  options: Option[];
  value: Option | null;
  setValue: (values: Option) => void;
  onHover: (value: Option) => void;
}

export type SelectProps = {
  targetRef: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  title: string | React.ReactNode;
  titleProps?: TextProps;
  placeholder?: string;
  placeholderProps?: TextProps;
  Icon?: React.FC<SvgProps>;
  iconProps?: SvgProps;
  wrapperProps?: BoxProps;
  tooltip: JSX.Element;
};

export interface TradeOptionsProps extends BoxProps {
  onMaxSlippageUpdate?: () => void;
}

export interface DropdownMenuProps extends Omit<BoxProps, "onClick"> {
  value?: Option | null;
  options: Option[];
  isMultiple?: boolean;
  values?: Option[];
  onClick: (option: Option) => void;
  onClose: () => void;
  onHover: (value: Option) => void;
}

export interface DropdownMenuItemProps extends Omit<Omit<DropdownMenuProps, "options">, "onClose"> {
  index: number;
  option: Option;
  title: string;
  onHover: (value: Option) => void;
}
