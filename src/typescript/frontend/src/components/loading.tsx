"use client";
// cspell:word unpathify

import { usePathname } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { Emoji } from "utils/emoji";
import { EMOJI_PATH_INTRA_SEGMENT_DELIMITER, ONE_SPACE } from "utils/pathname-helpers";

import { getRandomSymbolEmoji, SYMBOL_EMOJI_DATA, type SymbolEmojiData } from "@/sdk/emoji_data";

import AnimatedEmojiCircle from "./pages/launch-emojicoin/animated-emoji-circle";

const unpathify = (pathEmojiName: string) =>
  SYMBOL_EMOJI_DATA.byName(pathEmojiName.replaceAll(EMOJI_PATH_INTRA_SEGMENT_DELIMITER, ONE_SPACE));

export const Loading = ({
  emojis,
  numEmojis,
}: {
  emojis?: SymbolEmojiData[];
  numEmojis?: number;
}) => {
  const pathname = usePathname();
  const emojiCycle = useMemo(() => {
    const emojisInPath = pathname
      .split("/market/")
      .at(1)
      ?.split(";")
      .map(unpathify)
      .filter((e) => typeof e !== "undefined");

    if (emojisInPath?.length) return emojisInPath;
    if (emojis?.length) return emojis;
    return Array.from({ length: 20 }, getRandomSymbolEmoji);
  }, [pathname, emojis]);

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
          <AnimatedEmojiCircle className={centered} numEmojis={numEmojis} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
