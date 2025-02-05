"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Flex, Column } from "@containers";
import { MessageContainer } from "./components";
import { type ChatProps } from "../../types";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEventStore } from "context/event-store-context";
import { useEmojiPicker } from "context/emoji-picker-context";
import EmojiPickerWithInput from "../../../../emoji-picker/EmojiPickerWithInput";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import { memoizedSortedDedupedEvents } from "lib/utils/sort-events";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { motion } from "framer-motion";
import { useChatTransactionBuilder } from "lib/hooks/transaction-builders/use-chat-builder";

const HARD_LIMIT = 500;

const ChatBox = (props: ChatProps) => {
  const { submit } = useAptos();
  const clear = useEmojiPicker((state) => state.clear);
  const setMode = useEmojiPicker((state) => state.setMode);
  const chats = useEventStore((s) => s.getMarket(props.data.symbolEmojis)?.chatEvents ?? []);
  const setPickerInvisible = useEmojiPicker((state) => state.setPickerInvisible);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const transactionBuilder = useChatTransactionBuilder(props.data.marketAddress);

  const sendChatMessage = async () => {
    // Set the picker invisible while the transaction is being processed.
    setPickerInvisible(true);
    const res = await submit(transactionBuilder);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      clear();
    } else {
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
