import type { fetchChatEvents } from "@sdk/indexer-v2";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetChatsSchema } from "app/api/chats/schema";
import { ROUTES } from "router/routes";
import { parseJSON } from "utils";
import { addSearchParams } from "utils/url-utils";
import type { z } from "zod";

export type ChatEvent = Awaited<ReturnType<typeof fetchChatEvents>>[number];

export const useChatEventsQuery = (args: z.input<typeof GetChatsSchema>) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchChatEvents", args],
    queryFn: ({ pageParam }) =>
      fetch(addSearchParams(ROUTES.api.chats, { ...args, page: pageParam })).then(async (r) => {
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(`HTTP error ${r.status}: ${errorText}`);
        }
        return parseJSON<ChatEvent[]>(await r.text());
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    // Disable the query when a marketID isn't provided
    enabled: !!args.marketID,
  });

  return query;
};
