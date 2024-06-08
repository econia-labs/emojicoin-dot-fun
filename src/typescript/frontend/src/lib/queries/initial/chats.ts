"use server";

import { toChatEvent } from "@sdk/types";
import { paginateChatEvents } from "@sdk/queries/chat";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";

const getInitialChatData = cache(
  async (args: { marketID: string; maxTotalRows?: number; maxNumQueries?: number }) => {
    const { marketID, maxTotalRows, maxNumQueries } = args;
    const chatEvents = await fetchInitialWithFallback({
      functionArgs: {
        marketID: BigInt(marketID),
        maxTotalRows,
        maxNumQueries,
      },
      queryFunction: paginateChatEvents,
    });

    return chatEvents.map((chat) => toChatEvent(chat, chat.version));
  }
);

export default getInitialChatData;
