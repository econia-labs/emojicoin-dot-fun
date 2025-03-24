"use client";

import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { Column, Flex } from "@containers";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useEventStore } from "context/event-store-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { motion } from "framer-motion";
import { useChatTransactionBuilder } from "lib/hooks/transaction-builders/use-chat-builder";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import _ from "lodash";
import React, { useEffect, useMemo, useRef } from "react";

import Loading from "@/components/loading";
import { LoadMore } from "@/components/ui/table/loadMore";

import EmojiPickerWithInput from "../../../../emoji-picker/EmojiPickerWithInput";
import type { ChatProps } from "../../types";
import { MessageContainer } from "./components";
import { useChatEventsQuery } from "./useChatEventsQuery";

const ChatBox = (props: ChatProps) => {
  const { submit } = useAptos();
  const clear = useEmojiPicker((state) => state.clear);
  const setMode = useEmojiPicker((state) => state.setMode);
  const chatsFromStore = useEventStore(
    (s) => s.getMarket(props.data.symbolEmojis)?.chatEvents ?? []
  );
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

  const chatsQuery = useChatEventsQuery({ marketID: props.data.marketID.toString() });

  const sortedChats = useMemo(() => {
    return _.orderBy(
      _.uniqBy(
        [...chatsFromStore, ...(chatsQuery.data?.pages.flat() || [])],
        (i) => i.transaction.version
      ),
      (i) => i.transaction.version,
      "desc"
    ).map((s, i) => ({
      message: {
        sender: s.chat.user,
        text: s.chat.message,
        senderRank: getRankFromEvent(s.chat).rankIcon,
        version: s.transaction.version,
      },
      shouldAnimateAsInsertion: i === 0 && !initialLoad.current,
    }));
  }, [chatsFromStore, chatsQuery.data?.pages]);

  if (chatsQuery.isLoading) return <Loading />;

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
              key={message.version}
              index={sortedChats.length - index}
              shouldAnimateAsInsertion={shouldAnimateAsInsertion}
            />
          ))}
          <LoadMore
            query={chatsQuery}
            className="mt-2 mb-4"
            endOfListText="This is the beginning of the chat"
          />
        </motion.div>
      </Flex>

      <EmojiPickerWithInput handleClick={sendChatMessage} />
    </Column>
  );
};

export default ChatBox;
