import { getRandomSymbolEmoji } from "@sdk/emoji_data";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

export const AnimatedStatusIndicator = ({
  numEmojis = 14,
  className,
}: {
  numEmojis?: number;
  className?: string;
}) => {
  const emojis = useMemo(() => Array.from({ length: numEmojis }), [numEmojis]).map(() =>
    getRandomSymbolEmoji()
  );
  const degrees = 360 / numEmojis;

  return (
    <motion.div
      className={className ?? "" + " pixel-heading-4 relative select-none mt-[100px]"}
      initial={{
        transform: "rotate(0deg)",
      }}
      transition={{
        repeat: Infinity,
        ease: null,
        duration: 2.5,
      }}
    >
      {emojis.map((emoji, i) => (
        <div key={`emoji-row-${i}`} className="relative">
          <div
            className="z-[-1] absolute top-0 left-0 w-[20px] h-[150px]"
            style={{
              transform: `translateX(-50%) translateY(-50%) rotate(${degrees * i}deg)`,
            }}
          >
            {emoji.emoji}
          </div>
          <div
            className="z-[1] absolute top-0 left-0 w-[30px] h-[160px]"
            style={{
              transform: `translateX(-50%) translateY(-50%) rotate(${degrees * i}deg)`,
            }}
          >
            <motion.div
              className="w-[30px] h-[30px] bg-black"
              initial={{
                opacity: 1,
              }}
              animate={{
                opacity: [null, 0, 1],
              }}
              transition={{
                delay: (1 / numEmojis) * i,
                duration: 1,
                ease: "circIn",
                repeat: Infinity,
              }}
            ></motion.div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default React.memo(AnimatedStatusIndicator);
