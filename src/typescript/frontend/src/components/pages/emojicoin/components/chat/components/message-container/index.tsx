import React, { useMemo } from "react";

import { FlexGap } from "@containers";
import {
  Arrow,
  StyledMessageContainer,
  StyledMessageInner,
  StyledMessageWrapper,
  StyledUserNameWrapper,
} from "./styled";
import { type MessageContainerProps } from "./types";
import { EXTERNAL_LINK_PROPS } from "components/link";
import { toExplorerLink } from "lib/utils/explorer-link";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { formatDisplayName } from "@sdk/utils";
import { motion } from "framer-motion";
import { Emoji } from "utils/emoji";
import { useNameResolver } from "@hooks/use-name-resolver";

const MessageContainer = ({ index, message, shouldAnimateAsInsertion }: MessageContainerProps) => {
  const { addressName: connectedWalletName } = useAptos();
  const senderAddressName = useNameResolver(message.sender);
  const { fromAnotherUser, displayName } = useMemo(
    () => ({
      fromAnotherUser: senderAddressName === connectedWalletName,
      displayName: formatDisplayName(senderAddressName),
    }),
    [connectedWalletName, senderAddressName]
  );

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
      <StyledMessageContainer layout fromAnotherUser={fromAnotherUser}>
        <StyledMessageWrapper layout fromAnotherUser={fromAnotherUser}>
          <StyledMessageInner>
            <Emoji
              className="pt-[1ch] p-[0.25ch] text-xl tracking-widest"
              style={{ wordBreak: "break-word" }}
              emojis={message.text}
            />
            <Arrow />
          </StyledMessageInner>

          <StyledUserNameWrapper>
            <FlexGap gap="10px">
              <a
                {...EXTERNAL_LINK_PROPS}
                href={toExplorerLink({ value: message.version, linkType: "version" })}
              >
                <span className="pixel-heading-4 text-light-gray uppercase hover:underline">
                  {displayName}
                </span>
              </a>
              <Emoji
                className="pixel-heading-4 text-light-gray uppercase"
                emojis={message.senderRank}
              />
            </FlexGap>
          </StyledUserNameWrapper>
        </StyledMessageWrapper>
      </StyledMessageContainer>
    </motion.div>
  );
};

export default MessageContainer;
