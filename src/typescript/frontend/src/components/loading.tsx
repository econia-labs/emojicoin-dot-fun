"use client";
// cspell:word unpathify

import React, { useEffect, useMemo } from "react";
import AnimatedStatusIndicator from "./pages/launch-emojicoin/animated-emoji-circle";
import { getRandomSymbolEmoji, SYMBOL_EMOJI_DATA, type SymbolEmojiData } from "@sdk/emoji_data";
import { Emoji } from "utils/emoji";
import { usePathname } from "next/navigation";
import { EMOJI_PATH_INTRA_SEGMENT_DELIMITER, ONE_SPACE } from "utils/pathname-helpers";
import { type EmojiMartData } from "./pages/emoji-picker/types";
import { init } from "emoji-mart";

const unpathify = (pathEmojiName: string) =>
  SYMBOL_EMOJI_DATA.byName(pathEmojiName.replaceAll(EMOJI_PATH_INTRA_SEGMENT_DELIMITER, ONE_SPACE));

const data = fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then(
  (res) =>
    res.json().then((data) => {
      return data as EmojiMartData;
    })
);

export const Loading = ({
  emojis,
  numEmojis,
}: {
  emojis?: SymbolEmojiData[];
  numEmojis?: number;
}) => {
  // Fetch/load the emoji picker data here to ensure that the picker has emoji data to use.
  // Since the library only initializes when the picker component is rendered, the library won't have
  // data on pages that don't use the picker component unless we explicitly call `init(...)` here.
  useEffect(() => {
    data.then((d) => {
      init({ set: "native", data: d });
    });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  const pathname = usePathname();
  // Use the emojis in the path if we're on the `market` page.
  const emojisInPath = pathname
    .split("/market/")
    .at(1)
    ?.split(";")
    .map(unpathify)
    .filter((e) => typeof e !== "undefined");

  const emojiCycle = useMemo(() => {
    if (emojisInPath?.length || emojis?.length) {
      // Note the `emojis!` below is because TypeScript can't infer that it's defined, but it definitely is.
      return emojisInPath?.length ? emojisInPath : emojis!;
    }
    return Array.from({ length: 20 }, getRandomSymbolEmoji);
  }, [emojisInPath, emojis]);

  const [emojiName, setEmojiName] = React.useState(emojiCycle[0].name);
  const [emoji, setEmoji] = React.useState(emojiCycle[0].emoji);

  useEffect(() => {
    const interval = setInterval(() => {
      emojiCycle.unshift(emojiCycle.pop()!);
      setEmoji(emojiCycle[0].emoji);
      setEmojiName(emojiCycle[0].name);
    }, 420.69);

    return () => clearInterval(interval);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const centered = "absolute left-0 right-0 ms-auto me-auto w-fit";

  return (
    <>
      <div className="flex relative w-full h-full m-auto">
        <div className="flex flex-col m-auto gap-10 max-w-[420px] justify-center items-center align-middle">
          <Emoji
            className={
              centered +
              " text-center mt-[.3rem]" +
              " mobile-sm:pixel-display-2 sm:pixel-display-2 !text-5xl"
            }
            title={emojiName}
            emojis={emoji}
          />
          <AnimatedStatusIndicator className={centered} numEmojis={numEmojis} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
