import { useEmojiPicker } from "context/emoji-picker-context";
import { useEventStore } from "context/event-store-context";
import { motion } from "framer-motion";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import _ from "lodash";
import { useEffect, useMemo, useRef } from "react";

import EmojiPickerWithInput from "@/components/emoji-picker/EmojiPickerWithInput";
import { LoadMore } from "@/components/ui/table/loadMore";
import type { MarketStateModel } from "@/sdk/index";

import { MessageContainer } from "../../emojicoin/components/chat/components";
import { useChatBox } from "../../emojicoin/components/chat/useChatBox";
import { useChatEventsQuery } from "../../emojicoin/components/chat/useChatEventsQuery";
import { marketTernary } from "../utils";

interface Props {
  market0: MarketStateModel;
  market1: MarketStateModel;
}

export default function ChatTab({ market0, market1 }: Props) {
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
  const { position } = useCurrentPosition();

  const side = useMemo(() => {
    if (!position || !position.open) return null;
    return marketTernary(position, market0, market1);
  }, [position, market0, market1]);

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
        label: s.market.symbolData.symbol,
        version: s.transaction.version,
      },
      shouldAnimateAsInsertion: i === 0 && !initialLoad.current,
    }));
  }, [market1chatsFromStore, market0chatsFromStore, chats.data?.pages]);

  useEffect(() => {
    setMode("chat");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <div className="flex flex-col mobile-sm:max-h-[calc(100vh-60px)] md:max-h-none mobile-sm:h-auto md:h-[100%] overflow-hidden">
      <motion.div layoutScroll className="flex flex-col-reverse grow px-[21px] py-0 overflow-auto">
        {sortedChats.map(({ message, shouldAnimateAsInsertion }, index) => (
          <MessageContainer
            message={message}
            key={message.version}
            index={sortedChats.length - index}
            shouldAnimateAsInsertion={shouldAnimateAsInsertion}
            alignLeft={message.marketID === market0.market.marketID}
          />
        ))}
        <LoadMore
          query={chats}
          className="mt-2 mb-4"
          endOfListText="This is the beginning of the chat"
        />
      </motion.div>

      {!side ? (
        <div className="flex pixel-heading-3b justify-center items-center mb-4">
          {"You must enter a position first"}
        </div>
      ) : (
        <EmojiPickerWithInput inputGroupProps={{ disabled: !side }} handleClick={sendChatMessage} />
      )}
    </div>
  );
}
