"use server";

import { toChatEvent } from "@sdk/types";
import { paginateChatEvents } from "@sdk/queries/chat";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";

const getInitialChatData = cache(async (marketID: string) => {
  const chatEvents = await fetchInitialWithFallback({
    functionArgs: {
      marketID: BigInt(marketID),
    },
    queryFunction: paginateChatEvents,
  });

  return chatEvents.map((chat) => toChatEvent(chat, chat.version));
});

export default getInitialChatData;
