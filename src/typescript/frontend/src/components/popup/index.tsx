import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import "./styles.css";

const Popup: React.FC<
  React.PropsWithChildren<{ content: React.ReactNode; className?: string; uppercase?: boolean }>
> = ({ children, content, className, uppercase = true }) => {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={`TooltipContent ${className}`} sideOffset={5}>
            <div
              className={`text-black pixel-heading-4 font-pixelar ${uppercase ? "uppercase" : ""}`}
            >
              {content}
            </div>
            <RadixTooltip.Arrow className="TooltipArrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Popup;
