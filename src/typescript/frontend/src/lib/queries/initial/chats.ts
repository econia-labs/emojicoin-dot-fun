"use server";

import { type AnyNumberString, toChatEvent } from "@sdk/types";
import { paginateChatEvents } from "@sdk/queries/chat";

/**
 * TODO: We could eventually cache this data by setting the revalidation tag to the number of chats
 * for a given market. For now we don't cache anything to get fresh data every time, since we'd
 * eventually make the fetch calls on the client anyway.
 */
const fetchInitialChatData = async (args: {
  marketID: AnyNumberString;
  maxTotalRows?: number;
  maxNumQueries?: number;
}) => {
  const { marketID, maxTotalRows, maxNumQueries } = args;
  const chatEvents = await paginateChatEvents({
    marketID,
    maxTotalRows,
    maxNumQueries,
  });

  return chatEvents.map((chat) => toChatEvent(chat, chat.version));
};

export default fetchInitialChatData;
