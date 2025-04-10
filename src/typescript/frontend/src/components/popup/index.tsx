import "./styles.css";

import * as RadixPopover from "@radix-ui/react-popover";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import React from "react";
import isTouchDevice from "utils/is-touch-device";

const Popup: React.FC<
  React.PropsWithChildren<{ content: React.ReactNode; className?: string; uppercase?: boolean }>
> = ({ children, content, className, uppercase = true }) => {
  const tooltipContent = (
    <div className={`text-black pixel-heading-4 font-pixelar ${uppercase ? "uppercase" : ""}`}>
      {content}
    </div>
  );

  return isTouchDevice() ? (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{children}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content className={`TooltipContent ${className}`} sideOffset={5}>
          {tooltipContent}
          <RadixPopover.Arrow className="TooltipArrow" />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  ) : (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={`TooltipContent ${className}`} sideOffset={5}>
            {tooltipContent}
            <RadixTooltip.Arrow className="TooltipArrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Popup;
