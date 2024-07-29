"use client";

import React, { useEffect, useMemo } from "react";
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
import { type SymbolEmojiData } from "@sdk/emoji_data";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { useEmojiPicker } from "context/emoji-picker-context";
import EmojiPickerWithInput from "../../../../emoji-picker/EmojiPickerWithInput";
import { getRankFromChatEvent } from "lib/utils/get-user-rank";
import { mergeSortedEvents, sortEvents, toSortedDedupedEvents } from "lib/utils/sort-events";
import type { Types } from "@sdk/types/types";
import { parseJSON } from "utils";
import { MAX_NUM_CHAT_EMOJIS } from "@sdk/const";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";

const convertChatMessageToEmojiAndIndices = (
  message: string,
  mapping: Map<string, SymbolEmojiData>
) => {
  const emojiArr = message.match(emojiRegex()) ?? [];
  const indices: Record<string, number> = {};
  const bytesArray: Uint8Array[] = [];
  const sequence: number[] = [];

  for (const emoji of emojiArr) {
    if (!mapping.has(emoji)) {
      throw new Error(`Emoji ${emoji} not found in mapping.`);
    }
    if (indices[emoji] === undefined) {
      indices[emoji] = bytesArray.length;
      bytesArray.push(mapping.get(emoji)!.bytes);
    }
    sequence.push(indices[emoji]);
  }
  return { emojiBytes: bytesArray, emojiIndicesSequence: sequence };
};

const pickerClass = `
  absolute bottom-[55px] mb-[5px] xl:mb-0 xl:bottom-[-3.6%] bg-black
  right-[50%] xl:right-full translate-x-[50%] xl:translate-x-0 mr-0
`;

const getCombinedChats = (chats: readonly Types.ChatEvent[], marketID: bigint) => {
  const stateGuids = new Set(chats.map((chat) => chat.guid));
  const localChats: Types.ChatEvent[] = parseJSON(localStorage.getItem(`chats`) ?? "[]");
  const filteredChats = localChats.filter(
    (chat: Types.ChatEvent) => chat.marketID === marketID && !stateGuids.has(chat.guid)
  );
  sortEvents(filteredChats);
  return mergeSortedEvents(chats, filteredChats);
};

const ChatBox = (props: ChatProps) => {
  const { theme } = useThemeContext();
  const { aptos, account, submit } = useAptos();
  const marketID = props.data.marketID.toString();
  const clear = useEmojiPicker((state) => state.clear);
  const setMode = useEmojiPicker((state) => state.setMode);
  const emojis = useEmojiPicker((state) => state.emojis);
  const chats = getCombinedChats(
    useEventStore((s) => s.getMarket(marketID)?.chatEvents ?? props.data.chats),
    BigInt(props.data.marketID)
  );
  const chatEmojiData = useEmojiPicker((state) => state.chatEmojiData);
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const unsubscribe = useWebSocketClient((s) => s.unsubscribe);

  useEffect(() => {
    subscribe.chat(marketID);
    return () => unsubscribe.chat(marketID);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const loadMoreMessages = () => {
    // Paginate messages here.
  };

  const sendChatMessage = async () => {
    if (!account || emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS) {
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
    const res = await submit(builderLambda);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      clear();
    }
  };

  // TODO: Add infinite scroll to this.
  // For now just don't render more than `HARD_LIMIT` chats.
  const sortedChats = useMemo(() => {
    const HARD_LIMIT = 500;
    return toSortedDedupedEvents(props.data.chats, chats, "desc").slice(0, HARD_LIMIT);
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [props.data.chats.length, chats.length]);

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
          {sortedChats.map((chat, index) => {
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

      <EmojiPickerWithInput handleClick={sendChatMessage} pickerButtonClassName={pickerClass} />
    </Column>
  );
};

export default ChatBox;
