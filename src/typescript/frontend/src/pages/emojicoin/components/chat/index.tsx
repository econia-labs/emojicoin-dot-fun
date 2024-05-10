import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { EmojiClickData } from "emoji-picker-react";

import { useEmojicoinPicker } from "hooks";
import { useThemeContext } from "context";

import { Flex, InputGroup, Textarea, Column, Loader } from "components";
import { MessageContainer } from "./components";

const MESSAGE_LIST = [
  {
    user: "KIKI.APT",
    text: "🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤",
    userRank: "🐳",
    incoming: true,
  },
  {
    user: "hey_hey.APT",
    text: "🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤",
    userRank: "🐡",
    incoming: false,
  },
  {
    user: "KIKI.APT",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos, voluptates?",
    userRank: "🐳",
    incoming: true,
  },
  {
    user: "hey_hey.APT",
    text: "orem ipsum dolor sit amet.",
    userRank: "🐡",
    incoming: false,
  },
];

const Chat: React.FC = () => {
  const { theme } = useThemeContext();
  const [messageList, setMessageList] = useState([...MESSAGE_LIST, ...MESSAGE_LIST, ...MESSAGE_LIST]);

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
  });

  // const onKeyDownHandler = (e: KeyboardEvent) => {
  const onKeyDownHandler = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setMessageList([
        {
          user: "hey_hey.APT",
          text: (e.target as unknown as HTMLTextAreaElement).value,
          userRank: "🐡",
          incoming: false,
        },
        ...messageList,
      ]);
      (e.target as unknown as HTMLTextAreaElement).value = "";
    } else if (e.key !== "Backspace" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
      e.preventDefault();
    }
  }

  return (
    <Column width="100%">
      <Flex flexGrow="1" width="100%" overflowY="auto" maxHeight="267px" flexDirection="column-reverse">
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
            borderRight: `1px solid ${theme.colors.darkGrey}`,
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
        <InputGroup>
          <Textarea
            ref={targetRef}
            onKeyDown={onKeyDownHandler}
          />
        </InputGroup>
      </Flex>
      {tooltip}
    </Column>
  );
};

export default Chat;
