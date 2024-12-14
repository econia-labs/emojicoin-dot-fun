import { type symbolBytesToEmojis } from "@sdk/emoji_data";
import { type AnimationPlaybackControls, useAnimate } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Emoji } from "utils/emoji";

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
  // Position all emojis above the visible space.
  const initialY = -200;

  // Calculate a random position on the X axis.
  const x = useMemo(() => Math.random() * 90 + 5, []);

  // Calculate a random delay for the emojis to be staggered.
  const delay = useMemo(() => (Math.random() + index) * DROP_INTERVAL, [index]);

  const [scope, animate] = useAnimate();
  const [controls, setControls] = useState<AnimationPlaybackControls>();

  useEffect(() => {
    const controls = animate(
      scope.current,
      { top: "110vh" },
      {
        duration: DROP_FALL_TIME,
        delay,
        ease: [],
        repeat: Infinity,
        repeatDelay: emojis * DROP_INTERVAL - DROP_FALL_TIME, // Repeat after all the other emojis have fallen.
      }
    );

    setControls(controls);

    return () => controls.complete();
  }, [scope, animate, delay, emojis]);

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
        left: `${x}vw`,
        fontSize: "1em",
        top: initialY,
      }}
      ref={scope}
    >
      {name.emojis.map((e) => (
        <span key={`rain-drop-emoji-${e.hex}`}>
          <Emoji emojis={e.emoji} />
        </span>
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
      <div
        className="absolute top-[-1.1%] w-[100%] h-[1%] bg-black z-20"
        style={{
          boxShadow: "0px 0px 8px 8px black",
        }}
      ></div>
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
      <div
        className="absolute bottom-0 w-[100%] h-[1%] bg-black z-20"
        style={{
          boxShadow: "0px 0px 8px 8px black",
        }}
      ></div>
    </>
  );
}
