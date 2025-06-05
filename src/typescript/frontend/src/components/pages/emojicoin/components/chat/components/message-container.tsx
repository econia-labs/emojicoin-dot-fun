import { EXTERNAL_LINK_PROPS } from "components/link";
import { motion } from "framer-motion";
import { cn } from "lib/utils/class-name";
import { toExplorerLink } from "lib/utils/explorer-link";
import React, { useMemo } from "react";
import { Emoji } from "utils/emoji";

import { FlexGap } from "@/containers";
import { useNameResolver } from "@/hooks/use-name-resolver";
import { formatDisplayName } from "@/sdk/utils";

interface Props {
  index: number;
  message: {
    sender: string;
    text: string;
    label: string;
    version: bigint;
  };
  shouldAnimateAsInsertion?: boolean;
  alignLeft: boolean;
  backgroundColor?: string;
}

const MessageContainer = ({
  index,
  message,
  shouldAnimateAsInsertion,
  alignLeft,
  backgroundColor,
}: Props) => {
  const senderAddressName = useNameResolver(message.sender);
  const displayName = useMemo(() => formatDisplayName(senderAddressName), [senderAddressName]);

  const delay = React.useMemo(() => {
    // Start with minimal delay and increase logarithmically
    const baseDelay = 0.08;
    const maxDelay = 0.5;
    return Math.min(baseDelay + Math.log10(index + 1) * 0.08, maxDelay);
  }, [index]);

  return (
    <motion.div
      layout={shouldAnimateAsInsertion}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        transition: {
          type: "just",
          delay: delay,
        },
      }}
    >
      <motion.div className={cn("flex w-full", alignLeft ? "justify-start" : "justify-end")} layout>
        <motion.div
          className={cn(
            "mb-3 flex h-fit max-w-[160px] flex-col md:max-w-[317px]",
            alignLeft ? "items-start" : "items-end"
          )}
          layout
        >
          <div
            className={cn(
              "relative mx-2 mb-3 flex w-fit border-2 border-solid border-white p-1.5 radii-xs",
              alignLeft ? "bg-ec-blue" : "bg-blue"
            )}
            style={{
              boxShadow: "inset 0px 0px 8px 4px rgba(0, 0, 0, 0.6)",
              background: backgroundColor,
            }}
          >
            <Emoji
              className="p-[0.25ch] pt-[1ch] text-xl tracking-widest"
              style={{ wordBreak: "break-word" }}
              emojis={message.text}
            />
            <div
              className={cn(
                "absolute top-1/2 -z-10 h-2.5 w-2.5 -translate-y-[40%] rotate-45 bg-white",
                alignLeft ? "-left-1" : "-right-1"
              )}
            />
          </div>

          <FlexGap gap="10px">
            <a
              {...EXTERNAL_LINK_PROPS}
              href={toExplorerLink({ value: message.version, linkType: "version" })}
            >
              <span className="uppercase text-light-gray pixel-heading-4 hover:underline">
                {displayName}
              </span>
            </a>
            <Emoji className="uppercase text-light-gray pixel-heading-4" emojis={message.label} />
          </FlexGap>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MessageContainer;
