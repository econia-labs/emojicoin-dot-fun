"use client";

import React, { useEffect, useMemo } from "react";
import AnimatedStatusIndicator from "./pages/launch-emojicoin/animated-emoji-circle";
import { getRandomSymbolEmoji, type SymbolEmojiData } from "@sdk/emoji_data";

export const Loading = ({
  emojis,
  numEmojis,
}: {
  emojis?: SymbolEmojiData[];
  numEmojis?: number;
}) => {
  // console.log(emojis);
  const emojiCycle =
    typeof emojis === "undefined" || emojis.length === 0
      ? Array.from({ length: 20 }, getRandomSymbolEmoji)
      : emojis;
  console.log("emoji cycle:", emojiCycle);
  const [emojiName, setEmojiName] = React.useState(emojiCycle[0].name);
  const [emoji, setEmoji] = React.useState(emojiCycle[0].emoji);

  useEffect(() => {
    const interval = setInterval(() => {
      emojiCycle.unshift(emojiCycle.pop()!);
      setEmoji(emojiCycle[0].emoji);
      setEmojiName(emojiCycle[0].name);
    }, 3000);

    return () => clearInterval(interval);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const centered = "absolute left-0 right-0 ms-auto me-auto w-fit";

  return (
    <>
      <div className="flex relative w-full h-full m-auto">
        <div className="flex flex-col m-auto gap-10 max-w-[420px] justify-center items-center align-middle">
          <div
            className={
              centered +
              " text-center mt-[.3rem]" +
              " mobile-sm:pixel-display-2 sm:pixel-display-2 !text-5xl"
            }
            title={emojiName}
          >
            {emoji}
          </div>
          <AnimatedStatusIndicator className={centered} numEmojis={numEmojis} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
