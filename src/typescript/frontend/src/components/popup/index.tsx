import "./styles.css";

import * as RadixPopover from "@radix-ui/react-popover";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ClassValue } from "clsx";
import { cn } from "lib/utils/class-name";
import React from "react";
import isTouchDevice from "utils/is-touch-device";

const Popup = ({
  children,
  content,
  className = "",
  arrowClassName = "",
  uppercase = true,
  popover = false,
}: React.PropsWithChildren<{
  content: React.ReactNode;
  className?: ClassValue;
  arrowClassName?: ClassValue;
  uppercase?: boolean;
  // Force a popover instead of a tooltip (click instead of hover). On touch devices, popover is used regardless.
  popover?: boolean;
}>) => {
  const tooltipContent = (
    <div className={`text-black pixel-heading-4 font-pixelar ${uppercase ? "uppercase" : ""}`}>
      {content}
    </div>
  );

  return popover || isTouchDevice() ? (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className={cn("TooltipContent", className)} sideOffset={5}>
          {tooltipContent}
          <RadixPopover.Arrow className={cn("fill-ec-blue", arrowClassName)} />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  ) : (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={cn("TooltipContent", className)} sideOffset={5}>
            {tooltipContent}
            <RadixTooltip.Arrow className={cn("fill-ec-blue", arrowClassName)} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Popup;
