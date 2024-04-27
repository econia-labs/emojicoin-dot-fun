import { PropsWithChildren } from "react";
import { FlexboxProps, SpaceProps } from "styled-system";

export interface CloseModalWrapperProps
  extends SpaceProps,
    FlexboxProps,
    PropsWithChildren<{
      closeModalHandler: () => void;
    }> {}
