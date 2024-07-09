import { SYMBOL_DATA } from "@sdk/emoji_data";
import { MarketValidityIndicator } from "components/emoji-picker/ColoredBytesIndicator";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";
import AnimatedStatusIndicator from "../animated-status-indicator";
import useInputStore from "@store/input-store";
import { translationFunction } from "context/language-context";
import { useRegisterMarket } from "../hooks/use-register-market";
import { useIsMarketRegistered } from "../hooks/use-is-market-registered";
import LaunchButtonOrGoToMarketLink from "./components/launch-or-goto";

const labelClassName = "whitespace-nowrap body-sm md:body-lg text-light-gray uppercase font-forma";

export const MemoizedLaunchAnimation = ({ loading }: { loading: boolean }) => {
  // Maybe it's this...? Maybe we need to memoize this value.
  const { t } = translationFunction();
  const setPickerInvisible = useInputStore((state) => state.setPickerInvisible);
  const emojis = useInputStore((state) => state.emojis);
  const setIsLoadingRegisteredMarket = useInputStore((state) => state.setIsLoadingRegisteredMarket);

  const registerMarket = useRegisterMarket();
  const { invalid, registered } = useIsMarketRegistered();

  useEffect(() => {
    return () => setIsLoadingRegisteredMarket(false);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

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
                handleClick={registerMarket}
                pickerButtonClassName="top-[220px] bg-black"
                inputClassName="!border !border-solid !border-light-gray rounded-md !flex-row-reverse pl-3 pr-1.5"
                inputGroupProps={{ label: "Select Emojis", scale: "xm" }}
              />
            </div>
          </div>
          <MarketValidityIndicator registered={registered} />
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
            <LaunchButtonOrGoToMarketLink
              invalid={invalid}
              registered={registered}
              onWalletButtonClick={() => {
                setPickerInvisible(true);
                registerMarket();
              }}
            />
          </div>
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
