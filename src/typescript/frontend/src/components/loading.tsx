import React, { useEffect } from "react";
import AnimatedStatusIndicator, {
  type StaggerSpeed,
} from "./pages/launch-emojicoin/animated-status-indicator";
import { getRandomEmoji, type SymbolEmojiData } from "@sdk/emoji_data";

export const Loading = ({
  emojis,
  animationSpeed,
}: {
  emojis?: SymbolEmojiData[];
  animationSpeed?: StaggerSpeed;
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

  return (
    <>
      <div className="flex relative w-full h-full">
        <div className="flex flex-col m-auto gap-10 w-[420px] max-w-[420px] justify-center items-center align-middle">
          <div
            className={
              "flex flex-col h-full justify-center items-center align-middle text-center pixel-display-1"
            }
            title={name}
          >
            {emoji}
          </div>
          <AnimatedStatusIndicator speed={animationSpeed} />
        </div>
      </div>
    </>
  );
};

export default React.memo(Loading);
