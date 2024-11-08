"use client";

import React, { useEffect } from "react";
import AnimatedStatusIndicator, {
  type StaggerSpeed,
} from "./pages/launch-emojicoin/animated-status-indicator";
import { getRandomSymbolEmoji, type SymbolEmojiData } from "@sdk/emoji_data";

export const Loading = ({
  emojis,
  numSquares,
  animationSpeed,
}: {
  emojis?: SymbolEmojiData[];
  numSquares?: number;
  animationSpeed?: StaggerSpeed;
}) => {
  const emojiCycle = emojis ?? Array.from({ length: 20 }, getRandomSymbolEmoji);
  const [{ name, emoji }, setEmoji] = React.useState(emojiCycle[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      emojiCycle.unshift(emojiCycle.pop()!);
      setEmoji(emojiCycle[0]);
    }, 3000);

    return () => clearInterval(interval);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <>
      <div className="flex relative w-full h-full m-auto">
        <div className="flex flex-col m-auto gap-10 max-w-[420px] justify-center items-center align-middle">
          <div
            className={
              "flex flex-col h-full justify-center items-center align-middle text-center" +
              " mobile-sm:pixel-display-2 sm:pixel-display-2"
            }
            title={name}
          >
            {emoji}
          </div>
          <AnimatedStatusIndicator speed={animationSpeed} numSquares={numSquares} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
