import { type ReactElement } from "react";

export type MobileMenuItemProps = {
  withIcon?: {
    className: string;
    icon: ReactElement;
  };
  title: string;
  onClick?: () => void;
  borderBottom?: boolean;
  pill?: {
    className: string;
    pill: React.ReactNode;
  };
};
