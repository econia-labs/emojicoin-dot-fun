import { Flex } from "@containers";
import { useEmojiPicker } from "context/emoji-picker-context";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { InputGroup, Textarea } from "components/inputs";
import { Arrow } from "components/svg";
import ClosePixelated from "@icons/ClosePixelated";
import EmojiPicker from "components/pages/emoji-picker/EmojiPicker";
import { motion } from "framer-motion";
import React, { useRef, useEffect, useCallback } from "react";
import { isDisallowedEventKey } from "utils";
import { MAX_NUM_CHAT_EMOJIS } from "components/pages/emoji-picker/const";
import { MarketValidityIndicator } from "./ColoredBytesIndicator";
import { variants } from "./animation-variants";
import { checkTargetAndStopDefaultPropagation } from "./utils";
import { getEmojisInString } from "@sdk/emoji_data";
import "./triangle.css";

/**
 * The wrapper for the input box, depending on whether or not we're using this as a chat input
 * or a symbol emoji picker for register market.
 */
const ConditionalWrapper = ({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "chat" | "register" | "pools" | "home";
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
  const inputRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLDivElement | null>(null);

  const emojis = useEmojiPicker((s) => s.emojis);
  const clear = useEmojiPicker((s) => s.clear);
  const mode = useEmojiPicker((s) => s.mode);
  const setTextAreaRef = useEmojiPicker((s) => s.setTextAreaRef);
  const setOnClickOutside = useEmojiPicker((s) => s.setOnClickOutside);
  const pickerInvisible = useEmojiPicker((s) => s.pickerInvisible);
  const setPickerInvisible = useEmojiPicker((s) => s.setPickerInvisible);
  const nativePicker = useEmojiPicker((s) => s.nativePicker);
  const insertEmojiTextInput = useEmojiPicker((s) => s.insertEmojiTextInput);
  const removeEmojiTextInput = useEmojiPicker((s) => s.removeEmojiTextInput);
  const textAreaRef = useEmojiPicker((s) => s.textAreaRef);

  const onRefChange = useCallback(
    (node: HTMLTextAreaElement | null) => {
      setTextAreaRef(node);
    },
    [setTextAreaRef]
  );

  // Append the picker visibility mutation to the end of the handleClick function.
  const handleSubmission = async (message: string) => {
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
          setPickerInvisible(true);
        }
      }
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (checkTargetAndStopDefaultPropagation(e, textAreaRef)) {
        const pastedText = e.clipboardData.getData("text");
        insertEmojiTextInput(pastedText);
      }
    },
    [insertEmojiTextInput, textAreaRef]
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const target = checkTargetAndStopDefaultPropagation(e, textAreaRef);
      if (target) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const selected = target.value.slice(start, end);
        navigator.clipboard.writeText(selected);
        removeEmojiTextInput();
      }
    },
    [removeEmojiTextInput, textAreaRef]
  );

  const onKeyDownHandler = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (!target) return;
    // I use this so much while developing that I need to account for it.
    // AKA: Allow refresh + hard refresh while the input is focused.
    if ((e.metaKey || e.ctrlKey) && (e.key === "r" || e.key === "F5")) {
      e.preventDefault();
      e.stopPropagation();
      window.location.reload();
    }
    if (getEmojisInString(e.key).length) {
      e.preventDefault();
      e.stopPropagation();
      insertEmojiTextInput(e.key);
    } else if (e.key === "Enter") {
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

  const closeIconClassName = `flex items-center justify-center relative h-full ml-[2.5ch] pr-[1ch] hover:cursor-pointer ${mode === "home" ? "med-pixel-close" : ""}`;

  const close = (
    <motion.div
      whileTap={{ scale: 0.85 }}
      className={closeIconClassName}
      onClick={() => {
        clear();
        setPickerInvisible(false);
      }}
    >
      {/* className={closeIconClassName} */}
      <ClosePixelated
        className={`w-[15px] h-[16px] ${mode !== "pools" && mode !== "home" ? "text-white" : "text-light-gray"}`}
      />
    </motion.div>
  );

  useEffect(() => {
    setPickerInvisible(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <Flex
      onFocus={(e) => {
        if (e.target !== sendButtonRef.current) {
          setPickerInvisible(false);
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
                {mode !== "pools" && mode != "home" && close}
                <Textarea
                  id="emoji-picker-text-area"
                  className={`relative !pt-[16px] px-[4px] scroll-auto ${mode === "home" ? "home-textarea" : ""}`}
                  ref={onRefChange}
                  autoFocus={true}
                  onPaste={handlePaste}
                  onCut={handleCut}
                  inputMode={nativePicker ? "text" : "none"}
                  onKeyDown={onKeyDownHandler}
                  onFocus={(e) => {
                    // Stop the focus from bubbling up to the `Flex` component above. We only want to focus
                    // this specific text area without triggering a focus on the `Flex` component.
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setPickerInvisible(false);
                  }}
                />
                {(mode === "pools" || mode === "home") && close}
                {mode === "chat" ? (
                  <>
                    <MarketValidityIndicator className="flex flex-row min-w-fit justify-end px-[1ch]" />
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        handleSubmission(emojis.join(""));
                      }}
                      className="flex relative h-full pl-[1ch] pr-[2ch] hover:cursor-pointer mb-[1px]"
                      style={{
                        cursor:
                          emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          emojis.length === 0 || emojis.length > MAX_NUM_CHAT_EMOJIS ? 0.2 : 1,
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
      {/* We don't not render the picker if we're using the nativePicker because there is logic within the picker
        we use for checking auxiliary (chat) emojis and other various things, so we still need to use it. */}
      <motion.button
        animate={nativePicker || pickerInvisible ? "hidden" : "visible"}
        variants={variants}
        initial={{
          zIndex: -1,
          opacity: 0,
          scale: 0,
        }}
        className={`absolute z-50 ${pickerButtonClassName}`}
      >
        <EmojiPicker id="picker" className={mode} />
      </motion.button>
    </Flex>
  );
};

export default EmojiPickerWithInput;
