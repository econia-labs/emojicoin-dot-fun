import { type PropsWithChildren } from "react";
import { type FlexboxProps, type SpaceProps } from "styled-system";

export interface CloseModalWrapperProps
  extends SpaceProps,
    FlexboxProps,
    PropsWithChildren<{
      closeModalHandler: () => void;
    }> {}
