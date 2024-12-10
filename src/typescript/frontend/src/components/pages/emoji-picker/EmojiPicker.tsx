"use client";
// cspell:word couldn

import {
  type HTMLAttributes,
  Suspense,
  useEffect,
  type PointerEventHandler,
  useCallback,
  useMemo,
} from "react";
import { useEmojiPicker } from "context/emoji-picker-context";
import { default as Picker } from "@emoji-mart/react";
import { SearchIndex } from "emoji-mart";
import { type EmojiMartData, type EmojiPickerSearchData, type EmojiSelectorData } from "./types";
import { unifiedCodepointsToEmoji } from "utils/unified-codepoint-to-emoji";
import { ECONIA_BLUE, ERROR_RED } from "theme/colors";
import RoundButton from "@icons/Minimize";
import { isIOS, isMacOs } from "react-device-detect";
import { getEmojiData, isSymbolEmoji, isValidChatMessageEmoji } from "@sdk/emoji_data";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";
import { MAX_SYMBOL_LENGTH } from "@sdk/const";

export type SearchResult = Array<EmojiPickerSearchData>;

export const search = async (value: string): Promise<SearchResult> => {
  return await SearchIndex.search(value);
};

/**
 * Checks if an emoji-mart input is a valid symbol emoji.
 */
export const isEmojiMartSymbolEmoji = (e?: EmojiMartData["emojis"][string]) =>
  isSymbolEmoji(e?.skins[0].native ?? "");

/**
 * * Checks if an emoji-mart input is a valid chat emoji.
 */
export const isEmojiMartChatEmoji = (e?: EmojiMartData["emojis"][string]) =>
  isValidChatMessageEmoji(e?.skins[0].native ?? "");

export default function EmojiPicker(
  props: HTMLAttributes<HTMLDivElement> & { drag: PointerEventHandler<HTMLDivElement> }
) {
  const setPickerRef = useEmojiPicker((s) => s.setPickerRef);
  const mode = useEmojiPicker((s) => s.mode);
  const emojis = useEmojiPicker((s) => s.emojis);
  const setPickerInvisible = useEmojiPicker((s) => s.setPickerInvisible);
  const host = document.querySelector("em-emoji-picker");
  const insertEmojiTextInput = useEmojiPicker((s) => s.insertEmojiTextInput);
  const currentBytes = useMemo(() => sumBytes(emojis), [emojis]);

  const filterEmojis = useCallback(
    (e?: EmojiMartData["emojis"][string]) =>
      mode === "chat" ? isEmojiMartChatEmoji(e) : isEmojiMartSymbolEmoji(e),
    [mode]
  );

  // This may become non-performant due to the interaction with the picker. It determines whether the picker grid emojis
  // should show as disabled or not. It runs in any mode, but short-circuits in "chat" or "search" mode.
  // Note this is a check on the currently highlighted emoji AND each emoji in the picker! The difference in how they
  // behave is determined by the CSS selectors with the `emojicoin-invalid-symbol` class. That is, if this function
  // returns true, both the highlighted (preview) emoji and the emojis in the picker will possess the class, but the
  // css that applies to them is determined in the `CSSStyleSheet` below.
  const shouldDisableInput = useCallback(
    (emoji?: string) => {
      if (!emoji || typeof emoji !== "string" || mode === "chat" || mode === "search") {
        return false;
      }
      const pickerInputBytes = getEmojiData(emoji)?.bytes.length ?? 0;
      return !isSymbolEmoji(emoji) || currentBytes + pickerInputBytes > MAX_SYMBOL_LENGTH;
    },
    [mode, currentBytes]
  );

  useEffect(() => {
    setPickerRef(host as HTMLDivElement);
  }, [host, setPickerRef]);

  useEffect(() => {
    const root = document.querySelector("em-emoji-picker")?.shadowRoot;
    if (root) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`
        section {
          --font-family: var(--font-pixelar) !important;
          --font-transform: uppercase !important;
          text-transform: uppercase !important;
          font-weight: 500 !important;
          background: var(--black) !important;
          color: ${ECONIA_BLUE} !important;
        }

        ${/* The emoji name label when selected */ ""}
        .preview-title.emojicoin-invalid-symbol {}

        ${/* The bytes label when selected */ ""}
        .preview-subtitle.emojicoin-invalid-symbol {
          color: ${ERROR_RED} !important;
          filter: brightness(1.25);
        }

        ${/* The big emoji preview when hovered. Also is the ☝️ when nothing is hovered. */ ""}
        #emoji-preview-wrapper.emojicoin-invalid-symbol {}

        ${/* Each emoji in the picker grid. */ ""}
        #emoji-picker-grid-item.emojicoin-invalid-symbol {
          opacity: 0.1;
          cursor: not-allowed;
        }

        ${
          isMacOs || isIOS
            ? ""
            : `.individual-emoji {
          font-family: var(--font-noto-color-emoji) !important;
          font-size: 0.9em;
        }`
        }

        div.flex div.search input {
          text-transform: uppercase !important;
        }

        div.preview-placeholder {
          color: ${ECONIA_BLUE} !important;
        }

        ::-webkit-scrollbar {
          width: 14px !important;
          height: 14px !important;
        }

        ::-webkit-scrollbar-thumb {
          background-color: #00000000 !important;
          border-radius: 5px !important;
          border: 4px solid rgba(0, 0, 0, 0) !important;
          box-shadow: inset 0 0 0 4px ${ECONIA_BLUE};
          text: ${ECONIA_BLUE};
        }

        ::-webkit-scrollbar-track {
          background-color: black !important;
        }
      `);
      const styleSheets = root.adoptedStyleSheets;
      root.adoptedStyleSheets = [...styleSheets, sheet];
    }
  }, []);

  const { drag, ...propsRest } = props;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div {...propsRest} className="relative bg-black rounded-xl shadow-econia">
        <div
          className="right-0 relative h-[29px] w-[100%] bg-ec-blue z-5"
          style={{
            touchAction: "none",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
          onPointerDown={drag}
        ></div>

        <div
          className="relative z-10 bg-black rounded-xl border-ec-blue border-solid border-[1px] border-t-0"
          style={{ marginTop: "-10px" }}
        >
          <Picker
            categories={[
              "new",
              "activity",
              "flags",
              "foods",
              "frequent",
              "nature",
              "objects",
              "people",
              "places",
              "symbols",
            ]}
            categoryIcons={{
              // Emojis from the more recent Unicode versions, set in the json passed to the emoji-mart `init` function.
              new: {
                svg: "<span>🆕</span>",
              },
            }}
            noCountryFlags={false}
            theme="dark"
            perLine={8}
            filterEmojis={filterEmojis}
            shouldDisableInput={shouldDisableInput}
            onEmojiSelect={(v: EmojiSelectorData) => {
              const newEmoji = unifiedCodepointsToEmoji(v.unified as `${string}-${string}`);
              insertEmojiTextInput([newEmoji]);
            }}
          />
        </div>

        <RoundButton
          className="absolute top-[4px] left-[5px] z-20 bg-red"
          onClick={() => {
            setPickerInvisible(true);
          }}
        />
      </div>
    </Suspense>
  );
}
