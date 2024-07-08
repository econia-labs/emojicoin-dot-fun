"use client";

import Button from "components/button";
import { translationFunction } from "context/language-context";
import { useRegisterMarket } from "./hooks/use-register-market";
import { SYMBOL_DATA } from "@sdk/emoji_data/symbol-data";
import TextCarousel from "components/text-carousel/TextCarousel";
import useInputStore from "@store/input-store";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ColoredBytesIndicator } from "components/emoji-picker/ColoredBytesIndicator";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { AnimatePresence, motion } from "framer-motion";
import { revalidateTagAction } from "lib/queries/cache-utils/revalidate";
import { TAGS } from "lib/queries/cache-utils/tags";
import { ROUTES } from "router/routes";
import { useRouter } from "next/navigation";
import path from "path";
import AnimatedStatusIndicator from "./animated-status-indicator";
import { AnimatedRegisterMarketCode } from "./animated-code";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { sleep, truncateAddress } from "@sdk/utils";

const labelClassName = "whitespace-nowrap body-sm md:body-lg text-light-gray uppercase font-forma";

const LOADING_TIME = 3000;

const ClientLaunchEmojicoinPage = () => {
  const { t } = translationFunction();
  const { emojis, setMode } = useInputStore((state) => ({
    emojis: state.emojis,
    setMode: state.setMode,
  }));
  const registerMarket = useRegisterMarket();
  const setPickerInvisible = useInputStore((state) => state.setPickerInvisible);
  const clear = useInputStore((state) => state.clear);
  const length = sumBytes(emojis);
  const invalid = length === 0 || length > 10;
  const router = useRouter();
  const { status } = useAptos();
  const { account } = useWallet();
  const [stage, setStage] = useState<"initial" | "loading" | "coding">("initial");

  useEffect(() => {
    setMode("register");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleLoading = useCallback(async () => {
    // Revalidate the registered markets tag.
    revalidateTagAction(TAGS.RegisteredMarkets);

    // Start the loading => coding animation sequence.
    setStage("loading");
    await sleep(LOADING_TIME);
    setStage("coding");
  }, []);

  useEffect(() => {
    console.log("CURRENT STAGE:", stage);
  }, [stage]);

  useEffect(() => {
    console.log("CURRENT EMOJIS:", emojis.join(" "));
  }, [emojis]);

  const handleFinishCoding = () => {
    startTransition(() => {
      const newPath = path.join(ROUTES.market, emojis.join(""));
      router.push(newPath);
      clear();
    });
  };

  useEffect(() => {
    if (status === "pending" || (status === "success" && stage === "initial")) {
      handleLoading();
    }
  }, [stage, status, handleLoading]);

  return (
    <div className="flex flex-col grow pt-[85px]">
      <TextCarousel />

      <div className="flex justify-center items-center h-full px-6">
        <div className="relative flex flex-col w-full max-w-[414px]">
          <AnimatePresence mode="wait">
            {/* Input */}
            {stage === "initial" && (
              <motion.div
                key={"register-market-input"}
                className="flex flex-col w-full"
                exit={{
                  opacity: 0,
                }}
              >
                <div className="flex relative mb-1">
                  <div className="flex flex-col grow relative w-full">
                    <EmojiPickerWithInput
                      handleClick={registerMarket}
                      pickerButtonClassName="top-[220px] bg-black"
                      inputClassName="!border !border-solid !border-light-gray rounded-md !flex-row-reverse pl-3 pr-1.5"
                      inputGroupProps={{ label: "Select Emojis", scale: "xm" }}
                    />
                  </div>
                </div>
                <ColoredBytesIndicator />
                <div className="flex">
                  <div className={labelClassName}>{t("Emojicoin Name:")}</div>
                  <div className="body-sm md:body-lg uppercase ellipses text-white font-forma ml-[0.5ch]">
                    {emojis.map((e) => SYMBOL_DATA.byEmoji(e)?.name).join(", ")}
                  </div>
                </div>

                <div className="flex">
                  <div className={labelClassName}>{t("Emojicoin Symbol:")}</div>
                  <div
                    className={
                      "body-sm md:body-lg uppercase whitespace-normal text-ellipsis text-white font-forma " +
                      "ml-[0.5ch] leading-6 "
                    }
                  >
                    {emojis.join(", ")}
                  </div>
                </div>

                <div className="flex flex-col justify-center m-auto pt-2">
                  <div className="pixel-heading-4 text-dark-gray uppercase">
                    {t("Cost to deploy:")} <span>1 APT</span>
                  </div>
                </div>

                <div className={"flex flex-col justify-center m-auto"}>
                  <ButtonWithConnectWalletFallback>
                    <Button
                      disabled={invalid}
                      onClick={() => {
                        setPickerInvisible(true);
                        registerMarket();
                      }}
                      scale="lg"
                      style={{ cursor: invalid ? "not-allowed" : "pointer" }}
                    >
                      {t("Launch Emojicoin")}
                    </Button>
                  </ButtonWithConnectWalletFallback>
                </div>
              </motion.div>
            )}
            {/* Status Indicator */}
            {stage === "loading" && (
              <motion.div
                key={"status-indicator"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute flex flex-col justify-center items-center w-full h-full gap-6"
              >
                <span className="pixel-heading-3 text-ec-blue uppercase">
                  Building your emojicoin...
                </span>
                <div className="relative">
                  <AnimatedStatusIndicator />
                </div>
              </motion.div>
            )}
            {stage === "coding" && account && (
              <motion.div
                key={"coding-terminal"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute flex flex-col justify-center items-center w-full h-full gap-6"
              >
                <div className="border border-solid border-[#FFFFFFBB] rounded-md p-6">
                  <AnimatedRegisterMarketCode
                    address={account.address as `0x${string}`}
                    emojis={emojis}
                    animationEndCallback={handleFinishCoding}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ClientLaunchEmojicoinPage;
