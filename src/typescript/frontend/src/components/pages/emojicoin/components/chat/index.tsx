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
import { useAptos } from "context/wallet-context/AptosContextProvider";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { toCoinTypes } from "@sdk/markets/utils";
import { Chat } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { CloseIconWithHover } from "components/svg";
import SendIcon from "@icons/SendIcon";
import emojiRegex from "emoji-regex";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";

const convertChatMessageToEmojiAndIndices = (message: string) => {
  const emojiArr = message.match(emojiRegex()) ?? [];
  const indices: Record<string, number> = {};
  const bytesArray: Uint8Array[] = [];
  const sequence: number[] = [];
  for (const emoji of emojiArr) {
    if (indices[emoji] === undefined) {
      indices[emoji] = bytesArray.length;
      bytesArray.push(SYMBOL_DATA.byEmoji(emoji)!.bytes);
    }
    sequence.push(indices[emoji]);
  }
  return { emojiBytes: bytesArray, emojiIndicesSequence: sequence };
};

const ChatBox = (props: ChatProps) => {
  const { theme } = useThemeContext();
  const { aptos, account, submit } = useAptos();
  // TODO: Resolve address to Aptos name, store in state.
  const [messageList, setMessageList] = useState(
    props.data.chats.map((chat) => ({
      sender: chat.user,
      text: chat.message,
      senderRank: chat.user.at(-1)?.toLowerCase() === "f" ? "🐳" : "🐡", // TODO: Check balance as fraction of circ supply
      version: chat.version,
    }))
  );

  const loadMoreMessages = () => {
    /* eslint-disable-next-line no-console */
    console.log("loadMoreMessages");
  };

  const onEmojiClickHandler = (emoji: EmojiClickData) => {
    if (targetElement && SYMBOL_DATA.hasEmoji(emoji.emoji)) {
      (targetElement as HTMLTextAreaElement).value =
        (targetElement as HTMLTextAreaElement).value + emoji.emoji;
    }
  };

  const { targetRef, tooltip, targetElement } = useEmojicoinPicker({
    onEmojiClick: onEmojiClickHandler,
    autoFocusSearch: false,
    width: 272,
  });

  const handleClear = () => {
    if (targetElement) {
      (targetElement as HTMLTextAreaElement).value = "";
    }
  };

  const sendChatMessage = async (emojiText: string) => {
    if (!account) {
      return;
    }
    const { emojicoin, emojicoinLP } = toCoinTypes(props.data.marketAddress);
    const { emojiBytes, emojiIndicesSequence } = convertChatMessageToEmojiAndIndices(emojiText);
    const builderLambda = () =>
      Chat.builder({
        aptosConfig: aptos.config,
        user: account.address,
        marketAddress: props.data.marketAddress,
        emojiBytes,
        emojiIndicesSequence: new Uint8Array(emojiIndicesSequence),
        typeTags: [emojicoin, emojicoinLP],
      });
    const { response, error: _ } = (await submit(builderLambda)) ?? {};
    if (response && isUserTransactionResponse(response)) {
      console.warn(response);
      setMessageList([
        {
          sender: account.ansName ?? account.address,
          text: emojiText,
          senderRank: "🐡",
          version: Number(response.version),
        },
        ...messageList,
      ]);
    }
    handleClear();
  };

  const onKeyDownHandler = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && account) {
      e.preventDefault();
      const emojiText = (e.target as unknown as HTMLTextAreaElement).value;
      await sendChatMessage(emojiText);
    } else if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  return (
    <Column width="100%" flexGrow={1}>
      <Flex
        flexGrow="1"
        width="100%"
        overflowY="auto"
        maxHeight="328px"
        flexDirection="column-reverse"
      >
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

      <Flex className="justify-center">
        <ButtonWithConnectWalletFallback className="mt-2">
          <InputGroup isShowError={false}>
            <div className="flex-row relative items-center justify-center">
              <Textarea
                className="!pt-[16px] !pl-[4.25ch]"
                ref={targetRef}
                onKeyDown={onKeyDownHandler}
              />
              <CloseIconWithHover
                className="absolute top-1/2 -translate-y-1/2 left-[1ch] !w-[21px]"
                color="white"
                onClick={handleClear}
              ></CloseIconWithHover>
              <SendIcon
                onClick={() => sendChatMessage((targetElement as HTMLTextAreaElement).value)}
                className="absolute top-1/2 -translate-y-1/2 right-[1ch] !w-[21px] !h-[21px] !mr-2 hover:cursor-pointer"
                color="white"
              />
            </div>
          </InputGroup>
        </ButtonWithConnectWalletFallback>
      </Flex>
      {tooltip}
    </Column>
  );
};

export default ChatBox;
