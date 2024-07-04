import { Flex } from "@containers";
import useInputStore from "@store/input-store";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { InputGroup, Textarea } from "components/inputs";
import { Arrow, CloseIconWithHover } from "components/svg";
import EmojiPicker from "components/pages/emoji-picker/EmojiPicker";
import { motion } from "framer-motion";
import { handleEmojiPickerInput } from "lib/utils/emoji-picker-selection";
import React, { useRef, useEffect, useState } from "react";
import { isDisallowedEventKey } from "utils";
import "./triangle.css";

/**
 * The wrapper for the input box, depending on whether or not we're using this as a chat input
 * or a symbol emoji picker for register market.
 */
const ConditionalWrapper = ({
  children,
  forChatInput,
}: {
  children: React.ReactNode;
  forChatInput?: boolean;
}) => {
  return forChatInput ?? false ? (
    <ButtonWithConnectWalletFallback className="mt-2">{children}</ButtonWithConnectWalletFallback>
  ) : (
    <>{children}</>
  );
};

export const EmojiPickerWithInput = ({
  handleClick,
  pickerButtonClassName,
  closeIconSide,
  inputGroupProps,
  inputClassName,
  showSend,
  forChatInput,
}: {
  handleClick: (message: string) => Promise<void>;
  closeIconSide: "left" | "right";
  pickerButtonClassName: string;
  inputGroupProps?: Partial<React.ComponentProps<typeof InputGroup>>;
  inputClassName?: string;
  showSend?: boolean;
  forChatInput?: boolean;
}) => {
  const { emojis, setEmojis, clear, mode } = useInputStore((s) => ({
    emojis: s.emojis,
    setEmojis: s.setEmojis,
    clear: s.clear,
    mode: s.mode,
  }));
  const inputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    clear();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const onKeyDownHandler = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (e.key === "Enter") {
      e.preventDefault();
      await handleClick(emojis.join(""));
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();

      const { newEmojis, newSelectionStart } = handleEmojiPickerInput({
        key: e.key,
        emojis,
        target,
      });

      setEmojis(newEmojis);

      // Reset the cursor position with a timeout delay, because `setEmojis` has to propagate through the state store
      // and update the text in the textarea.
      setTimeout(() => {
        target.selectionStart = newSelectionStart;
        target.selectionEnd = newSelectionStart;
      }, 0);
    } else if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  const [focused, setIsFocused] = useState(false);

  const variants = {
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
      // TODO: Fix this when we fork the picker. This shadow DOM stuff is so bad to work with...
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const closeIconClassName =
    "absolute top-1/2 -translate-y-1/2 !w-[21px] " +
    `${closeIconSide === "right" ? "right-3" : "left-[2.5ch]"}`;

  return (
    <Flex
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
      }}
      className="justify-center"
      ref={inputRef}
    >
      <ConditionalWrapper forChatInput={forChatInput}>
        <InputGroup isShowError={false} {...inputGroupProps}>
          <div className="flex-row relative items-center justify-center">
            <Textarea
              className={`!pt-[15px] ${inputClassName}`}
              value={emojis.join("")}
              placeholder=""
              onKeyDown={onKeyDownHandler}
            />
            <CloseIconWithHover
              className={closeIconClassName}
              color="white"
              onClick={clear}
            ></CloseIconWithHover>
            {showSend && (
              <Arrow
                onClick={() => handleClick(emojis.join(""))}
                className="absolute top-1/2 -translate-y-1/2 right-[1ch] !w-[21px] !h-[21px] !mr-2 hover:cursor-pointer"
                color="white"
              />
            )}
          </div>
        </InputGroup>
      </ConditionalWrapper>
      <motion.button
        onBlur={() => {
          setIsFocused(false);
        }}
        animate={focused ? "visible" : "hidden"}
        variants={variants}
        style={{
          opacity: 1,
          zIndex: focused ? 50 : -1,
          cursor: focused ? "auto" : "pointer",
          scale: focused ? 1 : 0,
        }}
        className={`absolute z-50 ${pickerButtonClassName}`}
      >
        <EmojiPicker id="picker" className={mode} />
      </motion.button>
    </Flex>
  );
};

export default EmojiPickerWithInput;
