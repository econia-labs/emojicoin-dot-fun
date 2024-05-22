import React from "react";

import { FlexGap } from "@/containers";
import { Text } from "components/text";

import {
  Arrow,
  StyledMessageContainer,
  StyledMessageInner,
  StyledMessageWrapper,
  StyledUserNameWrapper,
} from "./styled";

import { type MessageContainerProps } from "./types";

const MessageContainer: React.FC<MessageContainerProps> = ({ message }) => {
  return (
    <StyledMessageContainer isIncoming={message.incoming}>
      <StyledMessageWrapper>
        <StyledMessageInner>
          <Text textScale="bodySmall" color="black" pt="2px">
            {message.text}
          </Text>

          <Arrow />
        </StyledMessageInner>

        <StyledUserNameWrapper>
          <FlexGap gap="10px">
            <Text textScale="pixelHeading4" color="lightGrey" textTransform="uppercase">
              {message.user}
            </Text>

            <Text textScale="pixelHeading4" color="lightGrey" textTransform="uppercase">
              {message.userRank}
            </Text>
          </FlexGap>
        </StyledUserNameWrapper>
      </StyledMessageWrapper>
    </StyledMessageContainer>
  );
};

export default MessageContainer;
