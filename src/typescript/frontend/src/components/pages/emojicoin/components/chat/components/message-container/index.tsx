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
import { normalizeAddress, truncateAddress } from "@sdk/utils";

const MessageContainer: React.FC<MessageContainerProps> = ({ message }) => {
  const { account } = useAptos();
  const [fromAnotherUser, setFromAnotherUser] = useState(true);
  useEffect(() => {
    if (!account) {
      setFromAnotherUser(true);
      return;
    }
    const normalized = normalizeAddress(account.address);
    setFromAnotherUser(normalized !== message.sender);
  }, [account, fromAnotherUser, message]);

  return (
    <StyledMessageContainer fromAnotherUser={fromAnotherUser}>
      <StyledMessageWrapper fromAnotherUser={fromAnotherUser}>
        <StyledMessageInner>
          <Text textScale="bodySmall" color="black" pt="2px">
            {message.text}
          </Text>

          <Arrow />
        </StyledMessageInner>

        <StyledUserNameWrapper>
          <FlexGap gap="10px">
            <a
              {...EXTERNAL_LINK_PROPS}
              href={toExplorerLink({ value: message.version, linkType: "version" })}
            >
              <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
                {truncateAddress(message.sender)}
              </Text>
            </a>

            <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
              {message.senderRank}
            </Text>
          </FlexGap>
        </StyledUserNameWrapper>
      </StyledMessageWrapper>
    </StyledMessageContainer>
  );
};

export default MessageContainer;
