"use client";

import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { type EmojiClickData } from "emoji-picker-react";

import { useEmojicoinPicker } from "hooks";
import { useThemeContext } from "context";
import { isDisallowedEventKey } from "utils";

import { Flex, Column } from "@containers";
import { InputGroup, Textarea, Loader } from "components";

import { MessageContainer } from "./components";
import { type ChatProps } from "../../types";
import { truncateAddress } from "@sdk/utils/misc";

const Chat = (props: ChatProps) => {
  const { theme } = useThemeContext();
  // TODO: Resolve address to Aptos name, store in state.
  const [messageList, setMessageList] = useState(
    props.data.chats.map(chat => ({
      user: truncateAddress(chat.user),
      text: chat.message,
      userRank: chat.user.at(-1)?.toLowerCase() === "f" ? "🐳" : "🐡", // TODO: Fix random assignment of status.
      fromAnotherUser: chat.user !== "local user's address", // TODO: Actually check this value later.
      version: chat.version,
    })),
  );

  const loadMoreMessages = () => {
    /* eslint-disable-next-line no-console */
    console.log("loadMoreMessages");
  };

  const onEmojiClickHandler = (emoji: EmojiClickData) => {
    if (targetElement) {
      (targetElement as HTMLTextAreaElement).value = (targetElement as HTMLTextAreaElement).value + emoji.emoji;
    }
  };

  const { targetRef, tooltip, targetElement } = useEmojicoinPicker({
    onEmojiClick: onEmojiClickHandler,
    autoFocusSearch: false,
    width: 272,
  });

  const onKeyDownHandler = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setMessageList([
        {
          user: "hey_hey.APT",
          text: (e.target as unknown as HTMLTextAreaElement).value,
          userRank: "🐡",
          fromAnotherUser: false,
          version: 0x1234, // TODO: Fix this when submission is implemented.
        },
        ...messageList,
      ]);
      (e.target as unknown as HTMLTextAreaElement).value = "";
    } else if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  return (
    <Column width="100%" flexGrow={1}>
      <Flex flexGrow="1" width="100%" overflowY="auto" maxHeight="328px" flexDirection="column-reverse">
        <InfiniteScroll
          next={loadMoreMessages}
          hasMore={false}
          dataLength={10}
          inverse
          loader={
            <Flex width="100%" justifyContent="center">
              <Loader height="44px" width="44px" />
            </Flex>
          }
          style={{
            padding: "0px 21px",
            borderRight: `1px solid ${theme.colors.darkGray}`,
            display: "flex",
            flexDirection: "column-reverse",
          }}
        >
          {messageList.map((message, index) => {
            return <MessageContainer message={message} key={index} />;
          })}
        </InfiniteScroll>
      </Flex>

      <Flex>
        <InputGroup isShowError={false}>
          <Textarea ref={targetRef} onKeyDown={onKeyDownHandler} />
        </InputGroup>
      </Flex>
      {tooltip}
    </Column>
  );
};

export default Chat;
