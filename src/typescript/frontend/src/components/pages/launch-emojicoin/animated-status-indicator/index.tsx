import { type AnimationSequence, stagger, useAnimate } from "framer-motion";
import React, { useCallback, useMemo } from "react";
import { useEffect } from "react";

const useStaggerAnimation = (delay: number = 0) => {
  const [scope, animate] = useAnimate();

  const sequence: AnimationSequence = [
    [".item-1", { opacity: [0, 1], scale: [1, 1.05] }, { delay: stagger(0.05, { from: "first" }) }],
    [
      ".item-1",
      { opacity: [1, 0], scale: [1.05, 1] },
      { delay: stagger(0.05, { from: "first" }), at: "-0.25" },
    ],
  ];

  useEffect(() => {
    animate(sequence, {
      delay,
      repeat: Infinity,
      repeatType: "loop",
    });

    animate(
      ".item-1",
      {
        filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"],
      },
      { delay: stagger(0.03, { from: "last", startDelay: 0.5 }), duration: 4, repeat: Infinity }
    );
    /* eslint-disable-next-line */
  }, []);

  return scope;
};

export const AnimatedStatusIndicator = ({
  numSquares = 14,
  delay = 0,
}: {
  numSquares?: number;
  delay?: number;
}) => {
  const scope = useStaggerAnimation(delay);

  const emptyArray = useMemo(() => Array.from({ length: numSquares }), [numSquares]);

  const getSquares = useCallback(
    (color: boolean) =>
      emptyArray.map((_, i) => (
        <span
          key={color ? `color-${i}` : `gray-${i}`}
          className={`m-auto${color ? " item-1" : ""}`}
          style={
            color
              ? {
                  boxShadow: "0 0 15px 4px #00FF0055",
                }
              : {
                  opacity: 0.2,
                }
          }
        >
          {color ? "🟩" : "⬜"}
        </span>
      )),
    [emptyArray]
  );

  return (
    <div className="flex flex-row relative h-fit w-fit pixel-heading-4 " ref={scope}>
      <div className="flex flex-col gap-1">
        <div className="relative flex flex-row">
          {getSquares(true)}
          <div className="absolute top-[50%] translate-y-[-50%] left-0 gap-0 flex flex-row z-[-1]">
            {getSquares(false)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnimatedStatusIndicator);
