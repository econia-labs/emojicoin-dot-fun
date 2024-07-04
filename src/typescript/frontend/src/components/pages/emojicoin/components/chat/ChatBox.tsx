"use client";

import React, { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useThemeContext } from "context";
import { Flex, Column } from "@containers";
import { Loader } from "components";
import { MessageContainer } from "./components";
import { type ChatProps } from "../../types";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { Chat } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import emojiRegex from "emoji-regex";
import { SYMBOL_DATA, type SymbolEmojiData } from "@sdk/emoji_data";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import useInputStore from "@store/input-store";
import EmojiPickerWithInput from "../../../../emoji-picker/EmojiPickerWithInput";
import { getRankFromChatEvent } from "lib/utils/get-user-rank";

// TODO: Consolidate the two mappings in here into one with a single data source.
const convertChatMessageToEmojiAndIndices = (
  message: string,
  mapping: Map<string, SymbolEmojiData>
) => {
  const emojiArr = message.match(emojiRegex()) ?? [];
  const indices: Record<string, number> = {};
  const bytesArray: Uint8Array[] = [];
  const sequence: number[] = [];
  for (const emoji of emojiArr) {
    if (!mapping.has(emoji) && !SYMBOL_DATA.hasEmoji(emoji)) {
      throw new Error(`Emoji ${emoji} not found in mapping.`);
    }
    if (indices[emoji] === undefined) {
      indices[emoji] = bytesArray.length;
      if (SYMBOL_DATA.hasEmoji(emoji)) {
        bytesArray.push(SYMBOL_DATA.byEmoji(emoji)!.bytes);
      } else {
        bytesArray.push(mapping.get(emoji)!.bytes);
      }
    }
    sequence.push(indices[emoji]);
  }
  return { emojiBytes: bytesArray, emojiIndicesSequence: sequence };
};

const pickerClass = `
  absolute bottom-[55px] mb-[5px] xl:mb-0 xl:bottom-[-3.6%] bg-black
  right-[50%] xl:right-full translate-x-[50%] xl:translate-x-0 mr-0
`;

const ChatBox = (props: ChatProps) => {
  const { theme } = useThemeContext();
  const { aptos, account, submit } = useAptos();
  const marketID = props.data.marketID.toString();
  const chats = useEventStore((s) => s.getMarket(marketID)?.chatEvents ?? props.data.chats);
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.chat(marketID);
    return () => unsubscribe.chat(marketID);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  const { emojis, clear, chatEmojiData, setMode } = useInputStore((state) => ({
    emojis: state.emojis,
    clear: state.clear,
    chatEmojiData: state.chatEmojiData,
    setMode: state.setMode,
  }));

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const loadMoreMessages = () => {
    // Paginate messages here.
  };

  const sendChatMessage = async () => {
    if (!account) {
      return;
    }
    const emojiText = emojis.join("");
    const { emojicoin, emojicoinLP } = toCoinTypes(props.data.marketAddress);
    const { emojiBytes, emojiIndicesSequence } = convertChatMessageToEmojiAndIndices(
      emojiText,
      chatEmojiData
    );
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
    }
    clear();
  };

  return (
    <Column className="relative" width="100%" flexGrow={1}>
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
          {chats.map((chat, index) => {
            const message = {
              // TODO: Resolve address to Aptos name, store in state.
              sender: chat.user,
              text: chat.message,
              senderRank: getRankFromChatEvent(chat).rankIcon,
              version: chat.version,
            };
            return <MessageContainer message={message} key={index} />;
          })}
        </InfiniteScroll>
      </Flex>

      <EmojiPickerWithInput
        handleClick={sendChatMessage}
        closeIconSide="left"
        pickerButtonClassName={pickerClass}
        inputClassName="!pl-[5ch]"
        showSend={true}
        forChatInput={true}
      />
    </Column>
  );
};

export default ChatBox;
