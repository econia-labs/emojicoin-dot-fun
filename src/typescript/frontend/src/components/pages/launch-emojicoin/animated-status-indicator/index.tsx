import { type AnimationSequence, stagger, useAnimate } from "framer-motion";
import { useEffect } from "react";

const useStaggerAnimation = (delay: number = 0) => {
  //   animate(".red-box", animateRed);

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

const NUM_ELEMENTS = 14;
const elements = Array.from({ length: NUM_ELEMENTS });

export const AnimatedStatusIndicator = ({ delay = 0 }: { delay?: number }) => {
  const scope = useStaggerAnimation(delay);

  return (
    <div className="flex flex-row relative h-fit w-fit" ref={scope}>
      <div className="flex flex-col gap-1">
        <div className="relative flex flex-row">
          {elements.map((_, i) => (
            <span
              key={`colored-${i}`}
              className={`m-auto item-1`}
              style={{
                boxShadow: "0 0 15px 4px #00FF0055",
              }}
            >
              🟩
            </span>
          ))}
          <div className="absolute top-[50%] translate-y-[-50%] left-0 gap-0 flex flex-row z-[-1]">
            {elements.map((_, i) => (
              <span
                key={`gray-${i}`}
                className="m-auto"
                style={{
                  opacity: 0.2,
                }}
              >
                ⬜
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedStatusIndicator;
