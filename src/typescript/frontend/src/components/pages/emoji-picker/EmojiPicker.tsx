"use client";

import { type HTMLAttributes, Suspense, use, useEffect, useMemo } from "react";
import { useEmojiPicker } from "context/emoji-picker-context";
import { default as Picker } from "@emoji-mart/react";
import { init, SearchIndex } from "emoji-mart";
import { type EmojiMartData, type EmojiPickerSearchData, type EmojiSelectorData } from "./types";
import { unifiedCodepointsToEmoji } from "utils/unified-codepoint-to-emoji";
import { SYMBOL_DATA, type SymbolEmojiData } from "@sdk/emoji_data";
import { normalizeHex } from "@sdk/utils";
import { sumBytes } from "@sdk/utils/sum-emoji-bytes";

// We need to create two sets of data - one for the emoji picker for registration or home/pools ("search") mode and
// another for the emoji picker for chat mode.
// The non-chat data will basically exclude all skin variants that won't fit in the 10-byte limit.

// In order to exclude symbol emojis that are too big in a way that is compliant with the emoji mart data,
// we'll have to create separate IDs for the register mode data. We'll create custom emojis (it lets us create them)
// with those IDs and then include/exclude them based on the mode.

// THEN, we'll also iterate over the current # of emojis, and if all invariants are invalid (because too many bytes,
// or the ensuing combinations are all already registered markets), we'll exclude the emoji ID from the picker.

// Essentially we'll have to create three sets of emoji IDs, where they're all completely distinct values:
// 1. IDs that are valid for both register + chat
// 2. IDs that are valid for chat only
// 3. IDs that are valid for register only
//
// We exclude #2 when we're in register mode, and we exclude #3 when we're in chat mode.

// 1. Test adding custom emojis and see how it works. See if we can truly split them into two sets.

const data = fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then(
  (res) =>
    res.json().then((data: EmojiMartData) => {
      const emojisToPickerIDs = new Map<string, string>();
      const invalidSymbolEmojiIDs = new Set<string>();
      const validSymbolEmojiIDs = new Set<string>();
      const chatEmojiData = new Map<string, SymbolEmojiData>();

      Object.keys(data.emojis).forEach((key) => {
        const skinVariants = data.emojis[key].skins.map((skin) => skin.unified);
        const { name, id } = data.emojis[key];
        // To be safe, we parse and store this data ourselves, instead of relying on the library
        // for the native emoji value.
        const asEmojis = skinVariants.map((skin) =>
          unifiedCodepointsToEmoji(skin as `${string}-${string}`)
        );
        // Because the emoji picker groups each emoji by its skin tone variants, we can only exclude emojis
        // where *none* of the skin tone variants are valid.
        let allVariantsInvalid = true;
        asEmojis.forEach((emoji) => {
          const bytes = new TextEncoder().encode(emoji);
          const hex = normalizeHex(bytes);
          emojisToPickerIDs.set(emoji, id);
          allVariantsInvalid = allVariantsInvalid && !SYMBOL_DATA.hasEmoji(emoji);
          chatEmojiData.set(emoji, {
            name,
            emoji,
            hex,
            bytes,
          });
        });
        if (allVariantsInvalid) {
          invalidSymbolEmojiIDs.add(id);
        } else {
          validSymbolEmojiIDs.add(id);
        }
      });
      return {
        emojiMartData: data,
        emojisToPickerIDs,
        invalidSymbolEmojiIDs,
        validSymbolEmojiIDs,
        chatEmojiData,
      };
    })
);

export const ECONIA_BLUE = "#086CD9";

export type SearchResult = Array<EmojiPickerSearchData>;

export const search = async (value: string): Promise<SearchResult> => {
  return await SearchIndex.search(value);
};

export default function EmojiPicker(props: HTMLAttributes<HTMLDivElement>) {
  const setPickerRef = useEmojiPicker((s) => s.setPickerRef);
  const setChatEmojiData = useEmojiPicker((s) => s.setChatEmojiData);
  const mode = useEmojiPicker((s) => s.mode);
  const onClickOutside = useEmojiPicker((s) => s.onClickOutside);
  const host = document.querySelector("em-emoji-picker");
  const setEmojis = useEmojiPicker((s) => s.setEmojis);
  const emojis = useEmojiPicker((s) => s.emojis);

  const {
    emojiMartData,
    emojisToPickerIDs,
    invalidSymbolEmojiIDs,
    validSymbolEmojiIDs,
    chatEmojiData,
  } = use(data);

  const exclusionSet = useMemo(() => {
    if (mode === "register" && emojiMartData) {
      // Exclude any non-symbol emojis.
      console.log(invalidSymbolEmojiIDs.values());
      const exclusionSet = Array.from(invalidSymbolEmojiIDs.values());
      // console.log(exclusionSet);
      // const exclusionSet = new Set(invalidSymbolEmojiIDs);
      const numBytes = sumBytes(emojis);
      // Exclude any emojis that would exceed the byte limit.
      for (const emojiID of validSymbolEmojiIDs) {
        const emoji = emojiMartData.emojis[emojiID];
        // const emojiData = SYMBOL_DATA.byID(emojiID);
        // if (emojiData && numBytes + emojiData.bytes.length > 10) {
        // exclusionSet.add(emojiID);
        // }
      }

      return exclusionSet;
    }
    return [];
  }, [mode, emojiMartData, emojis, invalidSymbolEmojiIDs]);

  useEffect(() => {
    init({ set: "native", data: emojiMartData });
  }, [emojiMartData]);

  // TODO: Verify that the length of this set is the same length as the valid chat emojis array in the Move contract.
  // Load the data from the emoji picker library and then extract the valid chat emojis from it.
  // This way we don't have to construct our own `chat-emojis.json` file.
  useEffect(() => {
    setChatEmojiData(chatEmojiData);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [chatEmojiData]);

  useEffect(() => {
    setPickerRef(host as HTMLDivElement);
  }, [host, setPickerRef]);

  const previewSelector = host?.shadowRoot?.querySelector("div.margin-l");

  useEffect(() => {
    // We use query selector here because we're working with a shadow root in the DOM,
    // and there's no other way to get a reference to it in React.
    // We use a MutationObserver to watch for changes in the preview element,
    // and then we update the text content of the preview element to show the
    // byte size of the emoji.
    // We can make more changes here as necessary.
    if (previewSelector) {
      const setupObserver = () => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation, _i) => {
            mutation.addedNodes.forEach((node) => {
              const text = node.textContent;
              // The `text` here is the short code the library uses, aka `:smile:` or `:rolling_on_the_floor_laughing:`
              if (text?.at(0) === ":" && text?.at(-1) === ":") {
                // No matter what we need to replace the text, so let's just reset it if we can even find it.
                // The main reason we do this is because if we don't, the bytes text content sometimes shows up appended
                // to the end of the emoji.
                node.textContent = "";

                // Traverse the tree up and then down to the emoji element. This is a bit hacky,
                // but I think it's faster than using a querySelector, and we know the structure
                // of the DOM here won't change.
                const parent = node.parentElement?.parentElement?.parentElement;
                const emojiNode = parent
                  ?.querySelector("span.emoji-mart-emoji")
                  ?.querySelector("span");

                const emoji = emojiNode?.textContent;
                if (emoji) {
                  const numBytes = new TextEncoder().encode(emoji).length;
                  const bytes = numBytes.toString();
                  const formattedBytes = `${" ".repeat(2 - bytes.length)}${bytes}`;
                  if (mode === "register" && numBytes > 10) {
                    const span = document.createElement("span");
                    node.textContent = "";
                    span.textContent = `${formattedBytes} bytes`;
                    span.style.setProperty("color", "red", "important");
                    node.appendChild(span);

                    const notAllowed = document.createElement("span");
                    notAllowed.textContent = "🚫";
                    notAllowed.style.setProperty("position", "absolute", "important");
                    notAllowed.style.setProperty("left", "6px", "important");
                    notAllowed.style.setProperty("top", "3px", "important");
                    notAllowed.style.setProperty("font-size", "3rem", "important");
                    node.appendChild(notAllowed);
                  } else {
                    node.textContent = `${formattedBytes} bytes`;
                  }
                }
              }
            });
          });
        });

        const config = {
          childList: true,
          subtree: true,
        };

        observer.observe(previewSelector, config);

        return () => observer.disconnect();
      };

      setupObserver();
    }
  }, [previewSelector, mode]);

  useEffect(() => {
    const root = document.querySelector("em-emoji-picker")?.shadowRoot;
    if (root) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`
        section {
          min-width: 316px !important;
          --font-family: var(--font-pixelar) !important;
          --font-transform: uppercase !important;
          text-transform: uppercase !important;
          font-weight: 500 !important;
          background: var(--black) !important;
          color: ${ECONIA_BLUE} !important;
          border: 1px solid ${ECONIA_BLUE} !important;
          box-shadow: -1px 1px 7px 5px ${ECONIA_BLUE}33 !important;
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div {...props}>
        <Picker
          onClickOutside={onClickOutside}
          // perLine={8}
          dynamicWidth
          set="native" // TODO: Use "apple" if not on an apple device...? It has the best looking emojis.
          exceptEmojis={exclusionSet}
          onEmojiSelect={(v: EmojiSelectorData) => {
            const newEmoji = unifiedCodepointsToEmoji(v.unified as `${string}-${string}`);
            setEmojis([newEmoji]);
          }}
          custom={(() => {
            const emojis = emojiMartData.emojis;
            // We need to separate each individual category into the 3 sets of emoji IDs.
            // where they are: pickerBaseEmojis, pickerChatEmojis, pickerSymbolEmojis.
            // 1. If all variants are under 10 bytes, we include it in the base set and don't change its ID.
            // 2. If any variants are over 10 bytes, we split the 10 byte emojis into a separate set.
            //      a. The 10 byte emojis will have their IDs changed to `$CHAT::${emoji.id}`.
            //      b. The < 10 byte emojis will have their IDs changed to `$REGISTER::${emoji.id}`.
            //      c. Then we exclude the original ID of the emoji that contains the <=10 and >10 byte variants.
            //      d. In summary, we create a custom ID for the first two, then exclude the original ID from the picker.
            // 3. If all variants are over 10 bytes, for simplicity's sake, we'll remove the emoji from the base set
            //    and add it to the > 10 byte set.

            // First let's test that we can even create a custom emoji and remove the original one from the picker.
            const last = emojiMartData.categories[0].emojis.pop();
            console.log(emojiMartData.categories[0], last);
            return null;
            // Object.values(emojiMartData.categories).map(({ id, emojis }) => (
            //   const

            //   {
            //   id: `custom-${emoji.id}`,
            //   name: emoji.name,
            //   emojis: emoji.skins
            // }))
          })()}
        />
      </div>
    </Suspense>
  );
}
