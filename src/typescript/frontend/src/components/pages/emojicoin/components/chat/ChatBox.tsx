"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Flex, Column } from "@containers";
import { MessageContainer } from "./components";
import { type ChatProps } from "../../types";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { Chat } from "@/contract-apis/emojicoin-dot-fun";
import { useEventStore } from "context/event-store-context";
import { useEmojiPicker } from "context/emoji-picker-context";
import EmojiPickerWithInput from "../../../../emoji-picker/EmojiPickerWithInput";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import { memoizedSortedDedupedEvents } from "lib/utils/sort-events";
import { MAX_NUM_CHAT_EMOJIS } from "@sdk/const";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { motion } from "framer-motion";
import { toChatMessageEntryFunctionArgs } from "@sdk/emoji_data/chat-message";

const HARD_LIMIT = 500;

const ChatBox = (props: ChatProps) => {
  const { aptos, account, submit } = useAptos();
  const clear = useEmojiPicker((state) => state.clear);
  const setMode = useEmojiPicker((state) => state.setMode);
  const emojis = useEmojiPicker((state) => state.emojis);
  const chats = useEventStore((s) => s.getMarket(props.data.symbolEmojis)?.chatEvents ?? []);
  const setPickerInvisible = useEmojiPicker((state) => state.setPickerInvisible);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const sendChatMessage = async () => {
    if (!account || emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS) {
      return;
    }
    // Set the picker invisible while the transaction is being processed.
    setPickerInvisible(true);
    const emojiText = emojis.join("");
    const { marketAddress } = props.data.marketView.metadata;
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    const { emojiBytes, emojiIndicesSequence } = toChatMessageEntryFunctionArgs(emojiText);
    const builderLambda = () =>
      Chat.builder({
        aptosConfig: aptos.config,
        user: account.address,
        marketAddress,
        emojiBytes,
        emojiIndicesSequence,
        typeTags: [emojicoin, emojicoinLP],
      });
    const res = await submit(builderLambda);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      // Note we only clear the input if the transaction is successful.
      clear();
    } else {
      // Show the picker again in case the user wants to try again with the same input.
      setPickerInvisible(false);
    }
  };

  const initialLoad = useRef(true);
  useEffect(() => {
    initialLoad.current = false;
  }, []);

  // TODO: Add infinite scroll to this.
  // For now just don't render more than `HARD_LIMIT` chats.
  const sortedChats = useMemo(
    () =>
      memoizedSortedDedupedEvents({
        a: props.data.chats,
        b: chats,
        order: "desc",
        limit: HARD_LIMIT,
        canAnimateAsInsertion: !initialLoad.current,
      }).map(({ chat, transaction, shouldAnimateAsInsertion }) => ({
        message: {
          sender: chat.user,
          text: chat.message,
          senderRank: getRankFromEvent(chat).rankIcon,
          version: transaction.version,
        },
        shouldAnimateAsInsertion,
      })),
    /* eslint-disable react-hooks/exhaustive-deps */
    [props.data.chats.length, chats.length]
  );

  return (
    <Column className="relative" width="100%" flexGrow={1}>
      <Flex
        flexGrow="1"
        width="100%"
        overflowY="auto"
        maxHeight="328px"
        flexDirection="column-reverse"
      >
        <motion.div
          layoutScroll
          className="flex flex-col-reverse w-full justify-center px-[21px] py-0 border-r border-solid border-r-dark-gray"
        >
          {sortedChats.map(({ message, shouldAnimateAsInsertion }, index) => (
            <MessageContainer
              message={message}
              key={sortedChats.length - index}
              index={sortedChats.length - index}
              shouldAnimateAsInsertion={shouldAnimateAsInsertion}
            />
          ))}
        </motion.div>
      </Flex>

      <EmojiPickerWithInput handleClick={sendChatMessage} />
    </Column>
  );
};

export default ChatBox;
