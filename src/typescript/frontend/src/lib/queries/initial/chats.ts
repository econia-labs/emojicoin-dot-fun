import { toChatEvent, type JSONTypes } from "@/sdk/types";
import { paginateChatEvents } from "@/sdk/queries/chat";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";

const getInitialChatData = cache(async (marketID: bigint | number) => {
  const chatEvents: Array<JSONTypes.ChatEvent> = await fetchInitialWithFallback({
    functionArgs: {
      marketID,
    },
    queryFunction: paginateChatEvents,
    endpoint: new URL(`chat-data-${Number(marketID)}.json`, SAMPLE_DATA_BASE_URL),
  });

  return chatEvents.map(chat => toChatEvent(chat));
});

export default getInitialChatData;
