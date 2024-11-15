import { Flex } from "@containers";
import { useEmojiPicker } from "context/emoji-picker-context";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { InputGroup, Textarea } from "components/inputs";
import { Arrow } from "components/svg";
import ClosePixelated from "@icons/ClosePixelated";
import EmojiPicker from "components/pages/emoji-picker/EmojiPicker";
import { motion, useDragControls } from "framer-motion";
import React, { useRef, useEffect, useCallback } from "react";
import { isDisallowedEventKey } from "utils";
import { MAX_NUM_CHAT_EMOJIS } from "components/pages/emoji-picker/const";
import { MarketValidityIndicator } from "./ColoredBytesIndicator";
import { variants } from "./animation-variants";
import { checkTargetAndStopDefaultPropagation } from "./utils";
import { getEmojisInString } from "@sdk/emoji_data";
import { createPortal } from "react-dom";
import { type EmojiMartData } from "components/pages/emoji-picker/types";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import "./triangle.css";

const EMOJI_FONT_FAMILY =
  '"EmojiMart", "Segoe UI Emoji", "Segoe UI Symbol", ' +
  '"Segoe UI", "Apple Color Emoji", "Twemoji Mozilla", "Noto Color Emoji", ' +
  '"Android Emoji"';

const ChatInputBox = ({ children }: { children: React.ReactNode }) => {
  const { connected } = useWallet();
  return (
    <>
      <ButtonWithConnectWalletFallback className="mt-[6px]">
        {children}
      </ButtonWithConnectWalletFallback>
      {!connected && (
        <div className="flex justify-center absolute w-full opacity-20 z-[-1]">{children}</div>
      )}
    </>
  );
};

/**
 * The wrapper for the input box, depending on whether or not we're using this as a chat input
 * or a symbol emoji picker for register market.
 */
const ConditionalWrapper = ({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "chat" | "register" | "search";
}) => {
  return mode === "chat" ? <ChatInputBox>{children}</ChatInputBox> : <>{children}</>;
};

export const EmojiPickerWithInput = ({
  handleClick,
  pickerButtonClassName,
  inputGroupProps,
  inputClassName = "",
  filterEmojis,
}: {
  handleClick: (message: string) => Promise<void>;
  pickerButtonClassName?: string;
  inputGroupProps?: Partial<React.ComponentProps<typeof InputGroup>>;
  inputClassName?: string;
  filterEmojis?: (e: EmojiMartData["emojis"][string]) => boolean;
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
  const setEmojis = useEmojiPicker((s) => s.setEmojis);
  const removeEmojiTextInput = useEmojiPicker((s) => s.removeEmojiTextInput);
  const textAreaRef = useEmojiPicker((s) => s.textAreaRef);

  const containerRef = useRef<HTMLDivElement>(null);

  const ctrls = useDragControls();

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

  const handleNativeTextInput = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (!target) return;
    const emojisInString = getEmojisInString(e.currentTarget.value);
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      removeEmojiTextInput(e.key);
    } else if (emojisInString.length) {
      e.preventDefault();
      e.stopPropagation();
      setEmojis(emojisInString);
    }
  };

  const handleEmojiPickerInput = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const closeIconClassName =
    `flex items-center justify-center relative h-full ${mode !== "search" && "ml-[2.5ch] pr-[1ch]"} hover:cursor-pointer ` +
    `${mode === "search" ? "med-pixel-close" : ""}`;

  const close = (
    <motion.div whileTap={{ scale: 0.85 }} className={closeIconClassName} onClick={clear}>
      <ClosePixelated
        className={`w-[15px] h-[16px] ${mode !== "search" ? "text-white" : "text-light-gray"}`}
      />
    </motion.div>
  );

  useEffect(() => {
    setPickerInvisible(true);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <Flex
      style={{ ...(mode === "search" ? { width: "100%" } : {}) }}
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
                {mode !== "search" && close}
                <Textarea
                  id="emoji-picker-text-area"
                  className={`relative !pt-[16px] px-[4px] scroll-auto ${mode === "search" ? "home-textarea" : ""}`}
                  ref={onRefChange}
                  autoFocus={false}
                  onPaste={handlePaste}
                  onCut={handleCut}
                  inputMode={nativePicker ? "text" : "none"}
                  onKeyUp={nativePicker ? handleNativeTextInput : () => {}}
                  onKeyDown={
                    nativePicker
                      ? (e) => {
                          if (e.key === "Backspace" || e.key === "Delete") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }
                      : handleEmojiPickerInput
                  }
                  onFocus={(e) => {
                    // Stop the focus from bubbling up to the `Flex` component above. We only want to focus
                    // this specific text area without triggering a focus on the `Flex` component.
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    const shadowRoot = document.querySelector("em-emoji-picker")
                      ?.shadowRoot as ShadowRoot;
                    const pickerInputElement = shadowRoot.querySelector(
                      "div.search input"
                    ) as HTMLInputElement;
                    setPickerInvisible(false);
                    if (pickerInvisible) {
                      pickerInputElement.focus();
                    }
                  }}
                  data-testid="emoji-input"
                  style={{ fontFamily: EMOJI_FONT_FAMILY }}
                />
                {mode === "search" && close}
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
      {/* Note that we still render the picker even if we're using the nativePicker because there is logic within the
        picker we use for checking auxiliary (chat) emojis and other various things, so we still need to use it.
        We could decouple this, but we'll likely be using the data loaded in the EmojiPicker at some point in the app's
        lifecycle anyway, so it should be fine as is. */}
      {createPortal(
        <div
          className="fixed bg-transparent right-0"
          style={{
            zIndex: 100,
            ...(mode === "chat" ? { top: 0 } : { bottom: 0 }),
          }}
          ref={containerRef}
        >
          <motion.button
            dragControls={ctrls}
            drag={true}
            dragTransition={{ power: 0.05, timeConstant: 100 }}
            dragListener={false}
            dragConstraints={useRef(document.body)}
            whileDrag={{ scale: 1.03 }}
            animate={nativePicker || pickerInvisible ? "hidden" : "visible"}
            variants={variants}
            initial={{
              zIndex: -1,
              opacity: 0,
              scale: 0,
            }}
            className={`absolute ${pickerButtonClassName}`}
            style={{
              right: 20,
              ...(mode === "chat" ? { top: 20 } : { bottom: 20 }),
            }}
          >
            <EmojiPicker
              id="picker"
              data-testid="picker"
              className={mode}
              drag={(e) => ctrls.start(e, { snapToCursor: false })}
              filterEmojis={filterEmojis}
            />
          </motion.button>
        </div>,
        document.body
      )}
    </Flex>
  );
};

export default EmojiPickerWithInput;
