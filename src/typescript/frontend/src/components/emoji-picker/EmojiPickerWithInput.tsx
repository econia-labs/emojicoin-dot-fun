import { Flex } from "@containers";
import useInputStore from "@store/input-store";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { InputGroup, Textarea } from "components/inputs";
import { Arrow } from "components/svg";
import ClosePixelated from "@icons/ClosePixelated";
import EmojiPicker from "components/pages/emoji-picker/EmojiPicker";
import { motion } from "framer-motion";
import { insertEmojiTextInput, removeEmojiTextInput } from "lib/utils/handle-emoji-picker-input";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { isDisallowedEventKey } from "utils";
import { MAX_NUM_CHAT_EMOJIS } from "components/pages/emoji-picker/const";
import { ColoredBytesIndicator } from "./ColoredBytesIndicator";
import { variants } from "./animation-variants";
import "./triangle.css";
import { checkTargetAndStopDefaultPropagation } from "./utils";

/**
 * The wrapper for the input box, depending on whether or not we're using this as a chat input
 * or a symbol emoji picker for register market.
 */
const ConditionalWrapper = ({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "chat" | "register";
}) => {
  return mode === "chat" ? (
    <ButtonWithConnectWalletFallback className="mt-2">{children}</ButtonWithConnectWalletFallback>
  ) : (
    <>{children}</>
  );
};

export const EmojiPickerWithInput = ({
  handleClick,
  pickerButtonClassName,
  inputGroupProps,
  inputClassName = "",
}: {
  handleClick: (message: string) => Promise<void>;
  pickerButtonClassName: string;
  inputGroupProps?: Partial<React.ComponentProps<typeof InputGroup>>;
  inputClassName?: string;
}) => {
  const [focused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const emojis = useInputStore((s) => s.emojis);
  const clear = useInputStore((s) => s.clear);
  const mode = useInputStore((s) => s.mode);
  const setTextAreaRef = useInputStore((s) => s.setTextAreaRef);
  const setOnClickOutside = useInputStore((s) => s.setOnClickOutside);
  const pickerInvisible = useInputStore((s) => s.pickerInvisible);
  const setPickerInvisible = useInputStore((s) => s.setPickerInvisible);

  // Append the picker visibility mutation to the end of the handleClick function.
  const handleSubmission = async (message: string) => {
    setPickerInvisible(true);
    await handleClick(message);
  };

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

  useEffect(() => {
    if (textAreaRef.current) setTextAreaRef(textAreaRef.current);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (checkTargetAndStopDefaultPropagation(e, textAreaRef.current)) {
      const pastedText = e.clipboardData.getData("text");
      insertEmojiTextInput(pastedText);
    }
  }, []);

  const handleCut = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const target = checkTargetAndStopDefaultPropagation(e, textAreaRef.current);
    if (target) {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const selected = target.value.slice(start, end);
      navigator.clipboard.writeText(selected);
      removeEmojiTextInput();
    }
  }, []);

  const onKeyDownHandler = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (!target) return;
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSubmission(emojis.join(""));
    } else if (e.ctrlKey || e.metaKey) {
      // Don't let the event propagate unless we're copying, cutting, pasting, or selecting all.
      if (!["c", "x", "v", "a"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      removeEmojiTextInput(e.key);
    } else if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [emojis]);

  const closeIconClassName =
    "flex items-center justify-center relative h-full ml-[2.5ch] pr-[1ch] hover:cursor-pointer";

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
      <ConditionalWrapper mode={mode}>
        <InputGroup isShowError={false} {...inputGroupProps}>
          <div className="flex-row relative items-center justify-center">
            <div className="relative h-[45px]">
              <div
                className={
                  "flex flex-row absolute items-center justify-between h-full w-full " +
                  "border-0 border-t-[1px] border-solid border-dark-gray " +
                  inputClassName
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
                  id="emoji-picker-text-area"
                  className="relative !pt-[16px] px-[4px] scroll-auto"
                  ref={textAreaRef}
                  autoFocus={true}
                  onPaste={handlePaste}
                  onCut={handleCut}
                  onKeyDown={onKeyDownHandler}
                  onClick={() => {
                    setPickerInvisible(false);
                    setTextAreaRef(textAreaRef.current); // Ensure the ref is set.
                  }}
                />
                {mode === "chat" ? (
                  <>
                    <ColoredBytesIndicator className="flex flex-row min-w-fit justify-end px-[1ch]" />
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        handleSubmission(emojis.join(""));
                        setIsFocused(false);
                        setPickerInvisible(true);
                      }}
                      className="flex relative h-full pl-[1ch] pr-[2ch] hover:cursor-pointer mb-[1px]"
                      style={{
                        cursor:
                          emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS
                            ? "not-allowed"
                            : "pointer",
                        opacity: emojis.length === 0 || emojis.length >= 100 ? 0.2 : 1,
                      }}
                      ref={sendButtonRef}
                    >
                      <Arrow className="!w-[21px] !h-[21px]" color="white" />
                    </motion.div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </InputGroup>
      </ConditionalWrapper>
      <motion.button
        animate={pickerInvisible ? "hidden" : focused ? "visible" : "hidden"}
        variants={variants}
        style={{
          opacity: 0, // Initially hidden.
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
