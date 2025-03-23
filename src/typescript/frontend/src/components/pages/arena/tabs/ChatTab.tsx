import { useChatEventsQuery } from "../../emojicoin/components/chat/useChatEventsQuery";
import { Column, Flex } from "@/components/layout";
import { motion } from "framer-motion";
import { LoadMore } from "@/components/ui/table/loadMore";
import EmojiPickerWithInput from "@/components/emoji-picker/EmojiPickerWithInput";
import { useEffect, useMemo, useRef } from "react";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import { useEventStore } from "context/event-store-context";
import _ from "lodash";
import { useEmojiPicker } from "context/emoji-picker-context";
import { MessageContainer } from "../../emojicoin/components/chat/components";
import { type ArenaPositionModel, type MarketStateModel } from "@econia-labs/emojicoin-sdk";
import { marketTernary } from "../utils";
import { useChatBox } from "../../emojicoin/components/chat/useChatBox";
import { getEmojiColor } from "lib/utils/emojiColors/emoji-color-data";

interface Props {
  market0: MarketStateModel;
  market1: MarketStateModel;
  position?: ArenaPositionModel | null;
}

export const ChatTab = ({ market0, market1, position }: Props) => {
  const setMode = useEmojiPicker((state) => state.setMode);
  const chats = useChatEventsQuery({
    marketID: [market0.market.marketID.toString(), market1.market.marketID.toString()],
  });
  const market0chatsFromStore = useEventStore(
    (s) => s.getMarket(market0.market.symbolEmojis)?.chatEvents ?? []
  );
  const market1chatsFromStore = useEventStore(
    (s) => s.getMarket(market1.market.symbolEmojis)?.chatEvents ?? []
  );

  const side = useMemo(() => {
    if (!position || (position.emojicoin0Balance === 0n && position.emojicoin1Balance === 0n))
      return null;
    return marketTernary(position, market0, market1);
  }, [market0, market1, position]);

  const { sendChatMessage } = useChatBox(side?.market.marketAddress);

  const initialLoad = useRef(true);
  useEffect(() => {
    initialLoad.current = false;
  }, []);

  const sortedChats = useMemo(() => {
    return _.orderBy(
      _.uniqBy(
        [...market1chatsFromStore, ...market0chatsFromStore, ...(chats.data?.pages.flat() || [])],
        (i) => i.transaction.version
      ),
      (i) => i.transaction.version,
      "desc"
    ).map((s, i) => ({
      message: {
        marketID: s.market.marketID,
        sender: s.chat.user,
        text: s.chat.message,
        senderRank: getRankFromEvent(s.chat).rankIcon,
        version: s.transaction.version,
      },
      shouldAnimateAsInsertion: i === 0 && !initialLoad.current,
    }));
  }, [market1chatsFromStore, market0chatsFromStore, chats.data?.pages]);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const [colorEmoji0, colorEmoji1] = useMemo(() => {
    return [getEmojiColor(market0.market.symbolEmojis), getEmojiColor(market1.market.symbolEmojis)];
  }, [market0.market.symbolEmojis, market1.market.symbolEmojis]);

  return (
    <Column className="relative" width="100%" height="100%" flexGrow={1}>
      <Flex flexGrow="1" width="100%" overflowY="auto" flexDirection="column-reverse">
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
              alignLeft={message.marketID === market0.market.marketID}
              backgroundColor={
                message.marketID === market0.market.marketID ? colorEmoji0 : colorEmoji1
              }
            />
          ))}
          <LoadMore
            query={chats}
            className="mt-2 mb-4"
            endOfListText="This is the beginning of the chat"
          />
        </motion.div>
      </Flex>

      {!side ? (
        <div className="flex pixel-heading-3b justify-center items-center">
          {"You must enter a position first"}
        </div>
      ) : (
        <EmojiPickerWithInput inputGroupProps={{ disabled: !side }} handleClick={sendChatMessage} />
      )}
    </Column>
  );
};
