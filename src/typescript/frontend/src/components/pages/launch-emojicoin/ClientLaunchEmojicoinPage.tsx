"use client";

import TextCarousel from "components/text-carousel/TextCarousel";
import { useEmojiPicker } from "context/emoji-picker-context";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getEmojisInString } from "@sdk/emoji_data";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { revalidateTagAction } from "lib/queries/cache-utils/revalidate";
import { TAGS } from "lib/queries/cache-utils/tags";
import { ROUTES } from "router/routes";
import { useRouter } from "next/navigation";
import path from "path";
import { sleep } from "@sdk/utils";
import { getEvents } from "@sdk/emojicoin_dot_fun";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import MemoizedLaunchAnimation from "./memoized-launch";

const LOADING_TIME = 2000;
type Stage = "initial" | "loading" | "coding";

const ClientLaunchEmojicoinPage = () => {
  const searchParams = useSearchParams();
  const emojiParams = searchParams.get("emojis");
  const setEmojis = useEmojiPicker((state) => state.setEmojis);
  const setMode = useEmojiPicker((state) => state.setMode);
  const router = useRouter();
  const { status, lastResponse: lastResponseFromContext } = useAptos();
  const lastResponse = useRef(lastResponseFromContext?.response);
  const isLoadingRegisteredMarket = useEmojiPicker((state) => state.isLoadingRegisteredMarket);
  const [stage, setStage] = useState<Stage>(isLoadingRegisteredMarket ? "loading" : "initial");

  useEffect(() => {
    if (emojiParams !== null) {
      setEmojis(getEmojisInString(emojiParams));
    }
    setMode("register");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // We need to store a reference to the last response in order to navigate to the market page after the market is
  // registered. Otherwise, `lastResponse` will be stale if we try to use it directly in the `handleLoading` function.
  useEffect(() => {
    if (
      lastResponseFromContext &&
      lastResponseFromContext.response &&
      isUserTransactionResponse(lastResponseFromContext.response)
    ) {
      const events = getEvents(lastResponseFromContext.response);
      if (events.marketRegistrationEvents.length === 1) {
        lastResponse.current = lastResponseFromContext.response;
      }
    }
  }, [lastResponseFromContext]);

  const handleLoading = useCallback(async () => {
    const response = lastResponse.current;
    if (response && isUserTransactionResponse(response)) {
      const lastResponseEvents = getEvents(response);
      if (!lastResponseEvents.marketRegistrationEvents.length) return;

      // NOTE: revalidateTagAction may cause a flicker in the loading animation because the server
      // rerenders and sends the RSC components again. To avoid this we'll probably need to finish the animation
      // orchestration with a different animation or cover it up somehow, otherwise I'm not sure how to fix it in a
      // clean way.

      // Revalidate the registered markets tag.
      revalidateTagAction(TAGS.RegisteredMarkets);

      startTransition(() => {
        // Parse the emojis from the market registration event.
        // We do this in case the emojis are somehow cleared before the response is received. This ensures that
        // the emojis we're referencing are always the static ones that were used to register the market.
        const marketRegistrationEvent = lastResponseEvents.marketRegistrationEvents[0];
        const { marketID, emojiBytes } = marketRegistrationEvent.marketMetadata;
        const { symbol } = symbolBytesToEmojis(emojiBytes);
        const newPath = path.join(ROUTES.market, symbol);
        try {
          router.push(newPath);
          router.refresh();
        } catch (e) {
          console.error("Failed to navigate to market page", e);
          const pathWithMarketID = path.join(ROUTES.market, marketID.toString());
          router.push(pathWithMarketID);
          router.refresh();
        }
      });
    }
  }, [lastResponse, router]);

  useEffect(() => {
    const shouldLoad = status === "pending" || (status === "success" && stage === "initial");
    if (!shouldLoad) return;

    // Start the loading animation.
    if (stage === "initial") {
      setStage("loading");
      sleep(LOADING_TIME).then(() => {
        handleLoading();
      });
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [status]);

  return (
    <div className="flex flex-col grow pt-[85px]">
      <TextCarousel />

      <div className="flex justify-center items-center h-full px-6">
        <div className="relative flex flex-col w-full max-w-[414px]">
          <MemoizedLaunchAnimation loading={isLoadingRegisteredMarket} />
        </div>
      </div>
    </div>
  );
};

export default ClientLaunchEmojicoinPage;
