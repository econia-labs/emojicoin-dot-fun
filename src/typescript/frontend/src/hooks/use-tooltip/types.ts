import { type Placement, type Padding } from "@popperjs/core";
import { type CSSProperties } from "react";
import { type Colors } from "theme/types";

export interface TooltipRefs {
  targetRef: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  tooltip: React.ReactNode;
  tooltipVisible: boolean;
  setVisible: (arg: boolean) => void;
}

export type TriggerType = "click" | "hover" | "focus";

export interface TooltipOptions {
  placement?: Placement;
  trigger?: TriggerType;
  arrowPadding?: Padding;
  tooltipPadding?: Padding;
  tooltipOffset?: [number, number];
  isEllipsis?: boolean;
  isInitiallyOpened?: boolean;
  hideTimeout?: number;
  showTimeout?: number;
  customStyles?: { tooltip?: CSSProperties; arrow?: CSSProperties };
  arrowBorderColor?: keyof Colors;
}

export type useSubscriptionEventsHandlersProps = {
  targetElement: HTMLElement | null;
  tooltipElement: HTMLElement | null;
  trigger: TriggerType;
  isInitiallyOpened?: boolean;
  hideTimeout: number;
  showTimeout: number;
};
