import React, { useEffect, useState } from "react";

import { FlexGap } from "@containers";
import { Text } from "components/text";

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
import { useNameStore } from "context/state-store-context";
import { motion } from "framer-motion";

const MessageContainer: React.FC<MessageContainerProps> = ({
  index,
  message,
  shouldAnimateAsInsertion,
}) => {
  const { account } = useAptos();
  const [fromAnotherUser, setFromAnotherUser] = useState(true);
  const nameResolver = useNameStore((s) =>
    s.getResolverWithNames(account?.address ? [account.address] : [])
  );
  useEffect(() => {
    if (!account) {
      setFromAnotherUser(true);
      return;
    }
    const selfName = nameResolver(account.address);
    setFromAnotherUser(selfName !== message.sender);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [account, message]);

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        transition: {
          type: "just",
          delay: shouldAnimateAsInsertion ? 0.2 : index * 0.02,
        },
      }}
    >
      <StyledMessageContainer layout fromAnotherUser={fromAnotherUser}>
        <StyledMessageWrapper layout fromAnotherUser={fromAnotherUser}>
          <StyledMessageInner>
            <span className="pt-[1ch] p-[0.25ch] text-xl tracking-widest">{message.text}</span>
            <Arrow />
          </StyledMessageInner>

          <StyledUserNameWrapper>
            <FlexGap gap="10px">
              <a
                {...EXTERNAL_LINK_PROPS}
                href={toExplorerLink({ value: message.version, linkType: "version" })}
              >
                <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
                  {formatDisplayName(message.sender)}
                </Text>
              </a>

              <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
                {message.senderRank}
              </Text>
            </FlexGap>
          </StyledUserNameWrapper>
        </StyledMessageWrapper>
      </StyledMessageContainer>
    </motion.div>
  );
};

export default MessageContainer;
