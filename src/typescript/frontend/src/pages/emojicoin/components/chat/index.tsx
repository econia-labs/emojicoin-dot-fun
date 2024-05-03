import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";

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
    user: "heyhey.APT",
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
    user: "heyhey.APT",
    text: "orem ipsum dolor sit amet.",
    userRank: "🐡",
    incoming: false,
  },
];

const Chat: React.FC = () => {
  const { theme } = useThemeContext();

  const loadMoreMessages = () => {
    console.log("loadMoreMessages");
  };

  return (
    <Column width="100%">
      <Flex flexGrow="1" width="100%" overflowY="auto" maxHeight="256px" flexDirection="column-reverse">
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
          {[...MESSAGE_LIST, ...MESSAGE_LIST, ...MESSAGE_LIST].map((message, index) => {
            return <MessageContainer message={message} key={index} />;
          })}
        </InfiniteScroll>
      </Flex>

      <Flex>
        <InputGroup>
          <Textarea />
        </InputGroup>
      </Flex>
    </Column>
  );
};

export default Chat;
