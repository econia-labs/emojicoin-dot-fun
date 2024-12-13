"use client";

import TextCarousel from "components/text-carousel/TextCarousel";
import { useEmojiPicker } from "context/emoji-picker-context";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getEmojisInString } from "@sdk/emoji_data";
import { useAptos } from "context/wallet-context/AptosContextProvider";
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

const ClientLaunchEmojicoinPage = () => {
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

  return (
    <div className="flex flex-col grow">
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
