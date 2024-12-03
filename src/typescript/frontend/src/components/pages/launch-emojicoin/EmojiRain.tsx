import { type symbolBytesToEmojis } from "@sdk/emoji_data";
import { type AnimationPlaybackControls, useAnimate } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";

const DROP_FALL_TIME = 7.5;
const DROP_INTERVAL = 1;

export function EmojiRainDrop({
  name,
  onClick,
  index,
  emojis,
}: {
  name: ReturnType<typeof symbolBytesToEmojis>;
  onClick?: (data: ReturnType<typeof symbolBytesToEmojis>) => void;
  index: number;
  emojis: number;
}) {
  const { height, width } = useWindowSize();

  // Position all emojis above the visible space.
  const initialX = -200;

  // Calculate a random position on the Y axis.
  const y = useMemo(() => Math.random() * (width - 20) + 10, [width]);

  // Calculate a random delay for the emojis to be staggered.
  const delay = useMemo(() => (Math.random() + index) * DROP_INTERVAL, [index]);

  const [scope, animate] = useAnimate();
  const [controls, setControls] = useState<AnimationPlaybackControls>();

  useEffect(() => {
    const controls = animate(
      scope.current,
      { top: height + 100 },
      {
        duration: DROP_FALL_TIME,
        delay,
        ease: [],
        repeat: Infinity,
        repeatDelay: emojis * DROP_INTERVAL * DROP_FALL_TIME, // Repeat after all the other emojis have fallen.
      }
    );

    setControls(controls);

    return () => controls.complete();
  }, [scope, animate, delay, height, emojis]);

  return (
    <div
      onClick={() => onClick && onClick(name)}
      onMouseOver={() => {
        if (controls) {
          controls.time += delay;
          controls.pause();
        }
      }}
      onMouseOut={() => controls?.play()}
      className="absolute emoji-rain-drop z-10 flex flex-col select-none cursor-pointer"
      style={{
        left: y,
        fontSize: "2em",
        top: initialX,
      }}
      ref={scope}
    >
      {name.emojis.map((e) => (
        <span key={`rain-drop-emoji-${e.hex}`}>{e.emoji}</span>
      ))}
    </div>
  );
}

export function EmojiRain({
  randomSymbols,
  onClick,
}: {
  randomSymbols: ReturnType<typeof symbolBytesToEmojis>[];
  onClick?: (symbol: ReturnType<typeof symbolBytesToEmojis>) => void;
}) {
  return (
    <>
      {randomSymbols.map((name, i) => {
        const emojiRainDrop = (
          <EmojiRainDrop
            key={`rain-drop-${name.emojis.map((e) => e.hex).reduce((a, b) => `${a}-${b}`, "")}`}
            name={name}
            onClick={onClick}
            index={i}
            emojis={randomSymbols.length}
          />
        );
        return emojiRainDrop;
      })}
    </>
  );
}
