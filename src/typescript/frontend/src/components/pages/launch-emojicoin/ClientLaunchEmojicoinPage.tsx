"use client";

import Button from "components/button";
import { translationFunction } from "context/language-context";
import { Column, Flex } from "@containers";
import { useRegisterMarket } from "./hooks/use-register-market";
import { SYMBOL_DATA } from "@sdk/emoji_data/symbol-data";
import TextCarousel from "components/text-carousel/TextCarousel";
import useInputStore from "@store/input-store";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { MAX_SYMBOL_LENGTH } from "@sdk/const";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const labelClassName = "whitespace-nowrap body-sm md:body-lg text-light-gray uppercase font-forma";

const sum = (emojis: string[]) => sumBytes(emojis);
const textColorBySum = (sum: number) => {
  if (sum === 0 || sum > 10) {
    return "text-error";
  }
  return "text-green";
};

const ClientLaunchEmojicoinPage = () => {
  const { t } = translationFunction();
  const { emojis, setMode } = useInputStore((state) => ({
    emojis: state.emojis,
    setMode: state.setMode,
  }));
  const registerMarket = useRegisterMarket();
  const length = sum(emojis);
  const invalid = length === 0 || length >= 10;

  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setMode("register");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setNonce((n) => n + 1);
  }, [length]);

  return (
    <Column pt="85px" flexGrow="1">
      <TextCarousel />

      <div className="flex justify-center items-center h-full px-6">
        <Column width="100%" maxWidth="414px">
          <Flex position="relative">
            <Column className="relative" width="100%" flexGrow={1}>
              <EmojiPickerWithInput
                handleClick={registerMarket}
                pickerButtonClassName="top-[220px] bg-black"
                inputClassName="!border !border-solid !border-light-gray bg-black"
                closeIconSide="right"
                inputGroupProps={{ label: "Select Emojis", scale: "xm" }}
                showSend={false}
                forChatInput={false}
              />
            </Column>
          </Flex>

          <div className="flex pixel-heading-4 uppercase">
            <motion.span
              key={nonce}
              animate={{
                scale: [1, 1.25, 1],
                transition: { duration: 0.1, repeat: 0 },
              }}
              style={{ scale: 1 }}
              className={textColorBySum(length)}
            >
              {length}
            </motion.span>
            <span className="text-white -rotate-[30deg]">{"/"}</span>
            <span className="text-white">{`${MAX_SYMBOL_LENGTH} bytes`}</span>
          </div>

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

          <div
            className={"flex flex-col justify-center m-auto"}
            onMouseEnter={() => {
              // Trigger a re-render to re-animate the byte length if it's invalid.
              if (invalid) {
                setNonce((n) => n + 1);
              }
            }}
          >
            <ButtonWithConnectWalletFallback>
              <Button
                disabled={invalid}
                onClick={registerMarket}
                scale="lg"
                style={{ cursor: invalid ? "not-allowed" : "pointer" }}
              >
                {t("Launch Emojicoin")}
              </Button>
            </ButtonWithConnectWalletFallback>
          </div>
        </Column>
      </div>
    </Column>
  );
};

export default ClientLaunchEmojicoinPage;
