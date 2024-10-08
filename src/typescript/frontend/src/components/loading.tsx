import React, { useEffect } from "react";
import AnimatedStatusIndicator from "./pages/launch-emojicoin/animated-status-indicator";
import { getRandomEmoji, type SymbolEmojiData } from "@sdk/emoji_data";

export const Loading = ({
  emojis,
  numSquares,
}: {
  emojis?: SymbolEmojiData[];
  numSquares?: number;
}) => {
  const emojiCycle = emojis ?? Array.from({ length: 20 }, getRandomEmoji);
  const [{ name, emoji }, setEmoji] = React.useState(emojiCycle[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      emojiCycle.unshift(emojiCycle.pop()!);
      setEmoji(emojiCycle[0]);
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
              " text-center" +
              " mobile-sm:pixel-display-2 sm:pixel-display-2 !text-5xl"
            }
            title={name}
          >
            {emoji}
          </div>
          <AnimatedStatusIndicator className={centered} numHearts={numSquares} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
