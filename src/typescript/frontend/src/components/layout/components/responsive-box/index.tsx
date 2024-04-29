import { forwardRef } from "react";

import { ContentWrapper, ResponsiveBoxWrapper } from "./styled";

import { ResponsiveBoxProps } from "./types";

export const ResponsiveBox = forwardRef<HTMLDivElement, ResponsiveBoxProps>(
  ({ width, aspectRatio, children, ...props }, ref) => {
    return (
      <ResponsiveBoxWrapper width={width} aspectRatio={aspectRatio} {...props} ref={ref}>
        <ContentWrapper>{children}</ContentWrapper>
      </ResponsiveBoxWrapper>
    );
  },
);

ResponsiveBox.displayName = "ResponsiveBox";
