import React from "react";

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

const MessageContainer: React.FC<MessageContainerProps> = ({ message }) => {
  return (
    <StyledMessageContainer fromAnotherUser={message.fromAnotherUser}>
      <StyledMessageWrapper>
        <StyledMessageInner>
          <Text textScale="bodySmall" color="black" pt="2px">
            {message.text}
          </Text>

          <Arrow />
        </StyledMessageInner>

        <StyledUserNameWrapper>
          <FlexGap gap="10px">
            <a {...EXTERNAL_LINK_PROPS} href={toExplorerLink({ value: message.version, type: "version" })}>
              <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
                {message.user}
              </Text>
            </a>

            <Text textScale="pixelHeading4" color="lightGray" textTransform="uppercase">
              {message.userRank}
            </Text>
          </FlexGap>
        </StyledUserNameWrapper>
      </StyledMessageWrapper>
    </StyledMessageContainer>
  );
};

export default MessageContainer;
