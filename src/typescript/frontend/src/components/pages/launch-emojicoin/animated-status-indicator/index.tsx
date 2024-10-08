import { getRandomEmoji } from "@sdk/emoji_data";
import {
  // type AnimationSequence,
  // stagger,
  // useAnimate,
  // type SequenceOptions,
  motion,
} from "framer-motion";
import React, { useMemo } from "react";
// import { useEffect } from "react";

//const useStaggerAnimation = () => {
//  const [scope, animate] = useAnimate();
//
//  const delay = stagger(0.05, { from: "first" });
//  const marginBottom = [0, 10, -3, 0];
//
//  const generateSequence: (i: number) => AnimationSequence = (i: number) => [
//    [`.item-${i}`, { marginBottom, opacity: i == 0 ? 1 : 0 }, { delay }],
//    [`.item-${i}`, { marginBottom, opacity: i == 1 ? 1 : 0 }, { delay }],
//    [`.item-${i}`, { marginBottom, opacity: i == 2 ? 1 : 0 }, { delay }],
//  ];
//
//  const sequence0 = generateSequence(0);
//  const sequence1 = generateSequence(1);
//  const sequence2 = generateSequence(2);
//
//  const options: SequenceOptions = {
//    repeat: Infinity,
//    repeatType: "loop",
//  };
//
//  useEffect(() => {
//    animate(sequence0, options);
//    animate(sequence1, options);
//    animate(sequence2, options);
//    /* eslint-disable-next-line */
//  }, []);
//
//  return scope;
//};

//export const AnimatedStatusIndicator = ({
//  numHearts = 14,
//}: {
//  numHearts?: number;
//}) => {
//  const scope = useStaggerAnimation();
//  const emptyArray = useMemo(() => Array.from({ length: numHearts }), [numHearts]);
//
//  const getHearts = useCallback(
//    (emoji: string, index: number) =>
//      emptyArray.map((_, i) => (
//        <span
//          key={`heart-${i}-${index}`}
//          className={`m-auto item-${index}`}
//          style={{
//          }}
//        >
//          {emoji}
//        </span>
//      )),
//    [emptyArray]
//  );
//
//  const hearts = ["🩷", "💚", "💙"];
//
//  return (
//    <div className="pixel-heading-4 relative select-none" ref={scope}>
//      {hearts.map((heart, i) => (
//        <div key={`heart-row-${i}`} className="absolute translate-y-[-50%] translate-x-[-50%] flex flex-row z-[-1] h-[2rem]">
//          {getHearts(heart, i)}
//        </div>
//      ))}
//    </div>
//  );
//};
//
//export default React.memo(AnimatedStatusIndicator);

export const AnimatedStatusIndicator = ({ numHearts = 14, className }: { numHearts?: number, className?: string }) => {
  const emojis = useMemo(() => Array.from({ length: numHearts }), [numHearts]).map(() =>
    getRandomEmoji()
  );
  const degrees = 360 / numHearts;

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
        <div key={`heart-row-${i}`} className="relative">
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
                delay: (1 / numHearts) * i,
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
