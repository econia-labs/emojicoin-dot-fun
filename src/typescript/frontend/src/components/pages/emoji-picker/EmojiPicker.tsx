"use client";
// cspell:word couldn

import { type HTMLAttributes, Suspense, useEffect } from "react";
import { useEmojiPicker } from "context/emoji-picker-context";
import { default as Picker } from "@emoji-mart/react";
import { init, SearchIndex } from "emoji-mart";
import { type EmojiMartData, type EmojiPickerSearchData, type EmojiSelectorData } from "./types";
import { unifiedCodepointsToEmoji } from "utils/unified-codepoint-to-emoji";
import { type SymbolEmojiData } from "@sdk/emoji_data";
import { normalizeHex } from "@sdk/utils";

// This is 400KB of lots of repeated data, we can use a smaller version of this if necessary later.
// TBH, we should probably just fork the library.
const data = fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then(
  (res) =>
    res.json().then((data) => {
      return data as EmojiMartData;
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
  const insertEmojiTextInput = useEmojiPicker((s) => s.insertEmojiTextInput);

  // TODO: Verify that the length of this set is the same length as the valid chat emojis array in the Move contract.
  // Load the data from the emoji picker library and then extract the valid chat emojis from it.
  // This way we don't have to construct our own `chat-emojis.json` file.
  useEffect(() => {
    data.then((d) => {
      const chatEmojiData = new Map<string, SymbolEmojiData>();

      Object.keys(d.emojis).forEach((key) => {
        const skinVariants = d.emojis[key].skins.map((skin) => skin.unified);
        const name = d.emojis[key].name;
        // To be safe, we parse and store this data ourselves, instead of relaying on the library
        // for the native emoji value.
        const asEmojis = skinVariants.map((skin) =>
          unifiedCodepointsToEmoji(skin as `${string}-${string}`)
        );
        asEmojis.forEach((emoji) => {
          const bytes = new TextEncoder().encode(emoji);
          const hex = normalizeHex(bytes);
          chatEmojiData.set(emoji, {
            name,
            emoji,
            hex,
            bytes,
          });
        });
      });

      setChatEmojiData(chatEmojiData);
      init({ set: "native", data: d });
    });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setPickerRef(host as HTMLDivElement);
  }, [host, setPickerRef]);

  const previewSelector = host?.shadowRoot?.querySelector("div.margin-l");
  const search = host?.shadowRoot?.querySelector("div.search input");

  useEffect(() => {
    if (!search || !host) return;
    const inputHandler = (_e: Event) => {
      const previewSubtitle = host.shadowRoot?.querySelector("div.preview-subtitle");
      if (!previewSubtitle) return;
      const text = previewSubtitle.textContent;
      const failedSearch =
        text && text.includes("That emoji couldn") && text.endsWith("t be found");
      if (failedSearch) {
        // There's a weird apostrophe character in the text, so just check startsWith and endsWith here.
        previewSubtitle.textContent = "That emoji couldn't be found";
      }
    };
    search?.addEventListener("input", inputHandler);

    return () => {
      search?.removeEventListener("input", inputHandler);
    };
  }, [search, host]);

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
                    span.id = "emoji-byte-size";
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
          // TODO: Use this function later instead of the current stuff we have, aka using `onBlur()`.
          onClickOutside={onClickOutside}
          perLine={8}
          exceptEmojis={[]}
          onEmojiSelect={(v: EmojiSelectorData) => {
            const newEmoji = unifiedCodepointsToEmoji(v.unified as `${string}-${string}`);
            insertEmojiTextInput([newEmoji]);
          }}
        />
      </div>
    </Suspense>
  );
}
