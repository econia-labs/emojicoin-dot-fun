import { type PropsWithChildren } from "react";

export interface ModalWrapperProps
  extends PropsWithChildren<{
    onOutsideClick: () => void;
  }> {
  id: string;
}
