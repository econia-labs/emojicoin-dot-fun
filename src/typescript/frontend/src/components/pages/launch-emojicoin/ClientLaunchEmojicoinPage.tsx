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
import { getEvents } from "@sdk/emojicoin_dot_fun";
import {
  isUserTransactionResponse,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import MemoizedLaunchAnimation from "./memoized-launch";
import { EmojiRain } from "./EmojiRain";

const LOADING_TIME = 2000;
type Stage = "initial" | "loading" | "coding";

const lastMarketRegistration = (
  response?: PendingTransactionResponse | UserTransactionResponse | null
) => {
  if (response && isUserTransactionResponse(response)) {
    return getEvents(response).marketRegistrationEvents.at(0);
  }
  return undefined;
};

const ClientLaunchEmojicoinPage: React.FC<{
  randomSymbols: ReturnType<typeof symbolBytesToEmojis>[];
}> = ({ randomSymbols }) => {
  const searchParams = useSearchParams();
  const emojiParams = searchParams.get("emojis");
  const setEmojis = useEmojiPicker((state) => state.setEmojis);
  const setMode = useEmojiPicker((state) => state.setMode);
  const router = useRouter();
  const {
    status,
    lastResponse: lastResponseFromContext,
    lastResponseStoredAt: lastResponseStoredAtFromContext,
  } = useAptos();
  const lastResponse = useRef(lastMarketRegistration(lastResponseFromContext?.response));
  const lastResponseStoredAt = useRef(lastResponseStoredAtFromContext);
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
    lastResponse.current = lastMarketRegistration(lastResponseFromContext?.response);
  }, [lastResponseFromContext]);

  useEffect(() => {
    lastResponseStoredAt.current = lastResponseStoredAtFromContext;
  }, [lastResponseStoredAtFromContext]);

  const handleLoading = useCallback(async () => {
    const marketRegistrationEvent = lastResponse.current;
    if (marketRegistrationEvent) {
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
  }, [router]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timeSinceLastResponseStored = Date.now() - lastResponseStoredAt.current;
    const shouldLoad =
      status === "pending" ||
      (status === "success" && stage === "initial" && timeSinceLastResponseStored < 1000);
    if (!shouldLoad) return;

    // Start the loading animation.
    let timeout: number;
    if (stage === "initial") {
      setStage("loading");

      timeout = window.setTimeout(() => {
        if (window.location.href.endsWith(ROUTES.launch)) {
          handleLoading();
        }
      }, LOADING_TIME);
    }

    return () => {
      // If the user navigates away, consider the animation as having been completed and cancel the rest
      // of the navigational animation orchestration.
      if (!window.location.href.endsWith(ROUTES.launch)) {
        window.clearTimeout(timeout);
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [status]);

  const backgroundDivClasses =
    "absolute w-[200vw] h-[130%] top-[-15%] " +
    "left-[-100vw] backdrop-blur-lg border-y-[1px] border-dark-gray " +
    "border-solid sm:border-x-[1px] sm:!w-[130%] sm:left-[-15%]";

  return (
    <div className="flex flex-col grow relative overflow-hidden">
      {randomSymbols.length > 0 && (
        <EmojiRain
          randomSymbols={randomSymbols}
          onClick={(name) => setEmojis(name.emojis.map((e) => e.emoji))}
        />
      )}
      <TextCarousel />

      <div className="flex justify-center items-center h-full px-6">
        <div className="relative flex flex-col w-full max-w-[414px] z-50">
          <div className={backgroundDivClasses}></div>
          <div className="z-50">
            <MemoizedLaunchAnimation loading={isLoadingRegisteredMarket} />
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-0 w-[100%] h-[1%] bg-black z-20"
        style={{
          boxShadow: "0px 0px 8px 8px black",
        }}
      ></div>
    </div>
  );
};

export default ClientLaunchEmojicoinPage;
