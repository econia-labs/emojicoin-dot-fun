import { type symbolBytesToEmojis } from "@sdk/emoji_data";
import { animate, motion, stagger } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useWindowSize } from "react-use";

export function EmojiRainDrop({
  name,
  onClick,
}: {
  name: ReturnType<typeof symbolBytesToEmojis>;
  onClick?: (data: ReturnType<typeof symbolBytesToEmojis>) => void;
}) {
  const { width } = useWindowSize();
  const initialX = useMemo(() => -10 - 100, []);
  const y = useMemo(() => Math.random() * (width - 20) + 10, [width]);

  return (
    <motion.div
      onClick={() => onClick && onClick(name)}
      className="absolute emoji-rain-drop z-10 flex flex-col select-none cursor-pointer"
      style={{
        left: y,
        fontSize: "2em",
        top: initialX,
      }}
    >
      {name.emojis.map((e) => (
        <span key={`rain-drop-emoji-${e.hex}`}>{e.emoji}</span>
      ))}
    </motion.div>
  );
}

export function EmojiRain({
  randomNames,
  onClick,
}: {
  randomNames: ReturnType<typeof symbolBytesToEmojis>[];
  onClick?: (symbol: ReturnType<typeof symbolBytesToEmojis>) => void;
}) {
  const { height } = useWindowSize();
  useEffect(() => {
    const staggeredItems = stagger(5, { startDelay: 1 });
    animate(
      ".emoji-rain-drop",
      {
        top: height + 100,
      },
      {
        duration: 30,
        delay: staggeredItems,
        ease: [],
      }
    );
  }, [height]);
  return (
    <>
      {randomNames.map((name) => {
        return (
          <EmojiRainDrop
            key={`rain-drop-${name.emojis.map((e) => e.hex).reduce((a, b) => `${a}-${b}`, "")}`}
            name={name}
            onClick={onClick}
          />
        );
      })}
    </>
  );
}
