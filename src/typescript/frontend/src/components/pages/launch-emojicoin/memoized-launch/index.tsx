import { SYMBOL_DATA } from "@sdk/emoji_data";
import { MarketValidityIndicator } from "components/emoji-picker/ColoredBytesIndicator";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";
import AnimatedStatusIndicator from "../animated-status-indicator";
import { useEmojiPicker } from "context/emoji-picker-context";
import { translationFunction } from "context/language-context";
import { useRegisterMarket } from "../hooks/use-register-market";
import { useIsMarketRegistered } from "../hooks/use-is-market-registered";
import LaunchButtonOrGoToMarketLink from "./components/launch-or-goto";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinDecimalString } from "lib/utils/decimals";
import { MARKET_REGISTRATION_FEE, ONE_APT_BIGINT } from "@sdk/const";

const labelClassName = "whitespace-nowrap body-sm md:body-lg text-light-gray uppercase font-forma";
// This is the value that most wallets use. It's an estimate, possibly incorrect, but better for UX.
const ESTIMATED_GAS_REQUIREMENT = 300000n;
const ESTIMATED_TOTAL_COST = MARKET_REGISTRATION_FEE + ESTIMATED_GAS_REQUIREMENT;

export const MemoizedLaunchAnimation = ({
  loading,
  geoblocked,
}: {
  loading: boolean;
  geoblocked: boolean;
}) => {
  // Maybe it's this...? Maybe we need to memoize this value.
  const { t } = translationFunction();
  const emojis = useEmojiPicker((state) => state.emojis);
  const setIsLoadingRegisteredMarket = useEmojiPicker(
    (state) => state.setIsLoadingRegisteredMarket
  );
  const { aptBalance, refetchIfStale } = useAptos();

  const registerMarket = useRegisterMarket();
  const { invalid, registered } = useIsMarketRegistered();

  useEffect(() => {
    return () => setIsLoadingRegisteredMarket(false);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const sufficientBalance = useMemo(() => aptBalance >= MARKET_REGISTRATION_FEE, [aptBalance]);
  const sufficientBalanceWithGas = useMemo(() => aptBalance >= ESTIMATED_TOTAL_COST, [aptBalance]);

  const numBytes = useMemo(() => {
    return sumBytes(emojis);
  }, [emojis]);

  useEffect(() => {
    refetchIfStale("apt");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [emojis]);

  const handleClick = async () => {
    if (!invalid && !registered) {
      await registerMarket();
    }
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {/* Input */}
      {!loading ? (
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
                geoblocked={geoblocked}
                handleClick={handleClick}
                pickerButtonClassName="top-[220px] bg-black"
                inputClassName="!border !border-solid !border-light-gray rounded-md !flex-row-reverse pl-3 pr-1.5"
                inputGroupProps={{ label: "Select Emojis", scale: "xm" }}
              />
            </div>
          </div>
          <MarketValidityIndicator
            className={
              emojis.length !== 0 &&
              numBytes <= 10 &&
              (registered || typeof registered === "undefined")
                ? "opacity-[0.65]"
                : ""
            }
            registered={registered}
          />
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
          <div className="flex flex-col justify-center m-auto pt-2 pixel-heading-4 uppercase">
            <div className="flex flex-col text-dark-gray">
              <div className="flex flex-row justify-between">
                <span className="mr-[2ch]">{t("Cost to deploy") + ": "}</span>
                <div>
                  <span className="">1</span>&nbsp;APT
                </div>
              </div>
              <div className="flex flex-row justify-between">
                <span className="mr-[2ch]">{t("Your balance") + ": "}</span>
                <div>
                  <span
                    className={
                      sufficientBalance ? "text-green" : "text-error brightness-[1.1] saturate-150"
                    }
                  >
                    {Number(toCoinDecimalString(aptBalance, aptBalance / ONE_APT_BIGINT < 1 ? 6 : 4))}
                  </span>
                  &nbsp;APT
                </div>
              </div>
            </div>
          </div>
          <motion.div
            className={"flex flex-col justify-center m-auto mt-[1ch]"}
            initial={{ opacity: 0.4 }}
            animate={{
              opacity: emojis.length === 0 || numBytes > 10 ? 0.4 : 1,
            }}
          >
            <LaunchButtonOrGoToMarketLink
              geoblocked={geoblocked}
              invalid={invalid || !sufficientBalance}
              registered={registered}
              onWalletButtonClick={() => {
                registerMarket();
              }}
            />
          </motion.div>

          {!sufficientBalanceWithGas && sufficientBalance && (
            <div className="flex flex-row pixel-heading-4 uppercase mt-[1ch]">
              <span className="text-error absolute w-full text-center">
                {t("Your transaction may fail due to gas costs.")}
              </span>
              <span className="relative opacity-0">{"placeholder"}</span>
            </div>
          )}
          <div className="h-[1ch] opacity-0">{"placeholder"}</div>
        </motion.div>
      ) : (
        // Status indicator.
        <motion.div
          key={"status-indicator"}
          animate={{ opacity: 1 }}
          className="absolute flex flex-col justify-center items-center w-full h-full gap-6"
        >
          <span className="pixel-heading-3 text-ec-blue uppercase">Building your emojicoin...</span>
          <div className="relative">
            <AnimatedStatusIndicator />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(MemoizedLaunchAnimation);
