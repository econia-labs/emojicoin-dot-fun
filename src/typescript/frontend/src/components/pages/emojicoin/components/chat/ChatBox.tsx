"use client";

import React, { useEffect } from "react";
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
import { Arrow } from "components/svg";
import emojiRegex from "emoji-regex";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { getRankFromChatEvent } from "lib/utils/get-user-rank";
import { motion } from "framer-motion";
import ClosePixelated from "@icons/ClosePixelated";

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
  const marketID = props.data.marketID.toString();
  const chats = useEventStore((s) => s.getMarket(marketID)?.chatEvents ?? props.data.chats);
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.chat(marketID);
    return () => unsubscribe.chat(marketID);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
    onEmojiClick: (emoji) => {
      onEmojiClickHandler(emoji);
      focusTextArea();
    },
    autoFocusSearch: false,
    width: 272,
  });

  const focusTextArea = () => {
    if (targetElement) {
      (targetElement as HTMLTextAreaElement).focus();
    }
  };

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

      <Flex className="justify-center">
        <ButtonWithConnectWalletFallback className="mt-2">
          <InputGroup isShowError={false}>
            <div className="flex-row relative items-center justify-center">
              <div className="relative h-[45px]">
                <div
                  className={
                    "flex flex-row absolute items-center justify-between h-full w-full " +
                    "border-0 border-t-[1px] border-solid border-dark-gray"
                  }
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="flex items-center justify-center relative h-full ml-[2.5ch] pr-[1ch] hover:cursor-pointer"
                    onClick={handleClear}
                  >
                    <ClosePixelated className="w-[15px] h-[16px] text-white" />
                  </motion.div>
                  <Textarea
                    autoFocus={true}
                    className="relative !pt-[16px] px-[4px]"
                    ref={targetRef}
                    onKeyDown={onKeyDownHandler}
                  />
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    onClick={() => sendChatMessage((targetElement as HTMLTextAreaElement).value)}
                    className="flex relative h-full pl-[1ch] pr-[2ch] hover:cursor-pointer mb-[1px]"
                  >
                    <Arrow className="!w-[21px] !h-[21px]" color="white" />
                  </motion.div>
                </div>
              </div>
            </div>
          </InputGroup>
        </ButtonWithConnectWalletFallback>
      </Flex>
      {tooltip}
    </Column>
  );
};

export default ChatBox;
