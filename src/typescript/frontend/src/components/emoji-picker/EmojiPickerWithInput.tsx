import { Flex } from "@containers";
import useInputStore from "@store/input-store";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { InputGroup, Textarea } from "components/inputs";
import { Arrow } from "components/svg";
import ClosePixelated from "@icons/ClosePixelated";
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
  const [focused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const emojis = useInputStore((s) => s.emojis);
  const setEmojis = useInputStore((s) => s.setEmojis);
  const clear = useInputStore((s) => s.clear);
  const mode = useInputStore((s) => s.mode);
  const setOnClickOutside = useInputStore((s) => s.setOnClickOutside);

  // Clear the input and set the onClickOutside event handler on mount.
  useEffect(() => {
    clear();

    setOnClickOutside((e: MouseEvent) => {
      if (inputRef.current) {
        const target = e.target as Node;
        const input = inputRef.current;

        if (!input.contains(target)) {
          setIsFocused(false);
        }
      }
    });

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

  const [selectionStart, setSelectionStart] = useState(0);
  const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement, Event>) => {
    setSelectionStart((e.target as HTMLTextAreaElement).selectionStart);
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [emojis]);

  const variants = {
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
    hidden: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const closeIconClassName =
    "flex items-center justify-center relative h-full ml-[2.5ch] pr-[1ch] hover:cursor-pointer" +
    `${closeIconSide === "right" ? "right-3" : ""}`;

  return (
    <Flex
      onFocus={(e) => {
        if (e.target !== sendButtonRef.current) {
          setIsFocused(true);
        }
      }}
      className="justify-center"
      ref={inputRef}
    >
      <ConditionalWrapper forChatInput={forChatInput}>
        <InputGroup isShowError={false} {...inputGroupProps}>
          <div className="flex-row relative items-center justify-center">
            <div className="relative h-[45px]">
              <div
                className={
                  "flex flex-row absolute items-center justify-between h-full w-full " +
                  "border-0 border-t-[1px] border-solid border-dark-gray"
                }
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={closeIconClassName}
                  onClick={clear}
                >
                  {/* className={closeIconClassName} */}
                  <ClosePixelated className="w-[15px] h-[16px] text-white" />
                </motion.div>
                <Textarea
                  autoFocus={true}
                  // className={`!pt-[15px] ${inputClassName}`}
                  className="relative !pt-[16px] px-[4px]"
                  value={emojis.join("")}
                  onSelect={handleTextSelect}
                  onKeyDown={onKeyDownHandler}
                  ref={textAreaRef}
                />
                {showSend ? (
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      handleClick(emojis.join(""));
                      setIsFocused(false);
                    }}
                    className="flex relative h-full pl-[1ch] pr-[2ch] hover:cursor-pointer mb-[1px]"
                    ref={sendButtonRef}
                  >
                    <Arrow className="!w-[21px] !h-[21px]" color="white" />
                  </motion.div>
                ) : null}
              </div>
            </div>
          </div>
        </InputGroup>
      </ConditionalWrapper>
      <motion.button
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
