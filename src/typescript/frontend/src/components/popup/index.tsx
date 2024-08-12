import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import "./styles.css";
import Text from "components/text";

const Popup: React.FC<
  React.PropsWithChildren<{ content: React.ReactNode; className?: string }>
> = ({ children, content, className }) => {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={`TooltipContent ${className}`} sideOffset={5}>
            {typeof content === "string" ||
            typeof content === "bigint" ||
            typeof content === "number" ||
            typeof content === "boolean" ? (
              <Text color="black">
                {content}
              </Text>
            ) : (
              content
            )}
            <RadixTooltip.Arrow className="TooltipArrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Popup;
