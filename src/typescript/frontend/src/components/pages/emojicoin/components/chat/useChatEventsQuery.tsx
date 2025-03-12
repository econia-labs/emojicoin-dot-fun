import { type fetchChatEvents } from "@sdk/indexer-v2";
import { LIMIT } from "@sdk/indexer-v2/const";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type GetChatsSchema } from "app/api/chats/schema";
import { ecFetch } from "lib/ecFetch/ecFetch";
import { ROUTES } from "router/routes";
import { type z } from "zod";

export type ChatEvent = Awaited<ReturnType<typeof fetchChatEvents>>[number];

export const useChatEventsQuery = (args: z.input<typeof GetChatsSchema>) => {
  const query = useInfiniteQuery({
    queryKey: ["fetchChatEvents", args],
    queryFn: ({ pageParam }) =>
      ecFetch<ChatEvent[]>(ROUTES.api.chats, {
        method: "GET",
        searchParams: { ...args, page: pageParam },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.length === LIMIT ? allPages.length + 1 : undefined,
    //Disable the query when neither sender nor marketID is provided
    enabled: !!args.marketID,
  });

  return query;
};
