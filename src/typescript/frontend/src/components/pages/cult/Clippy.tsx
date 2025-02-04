import { useCallback, useEffect, useRef } from "react";
import clippy, { type Agent } from "clippyts";
import "./clippy.css";

const ANIMATIONS_LOOP = ["Greeting", "Processing", "IdleAtom", "Congratulate"];
const ANIMATION_INTERVAL = 11000;

const FOUR_SECONDS = 4 * 1000;
/**
 * Each "word" adds 200ms:
 * @see {@link https://github.com/pi0/clippyjs/blob/d88943d529410114c9cea7f01e05de40254cd914/lib/balloon.js#L9/**}
 */
const WORD_SPEAK_TIME = 200;
/**
 * Add a flat amount of time at the end by adding spaces, each space counts as a "word" due to the regex used:
 * @see {@link https://github.com/pi-1/clippyjs/blob/d88943d529410114c9cea7f01e05de40254cd914/lib/balloon.js#L140}
 */
const FILLER_TO_LENGTHEN_DURATION = " ".repeat(FOUR_SECONDS / WORD_SPEAK_TIME);

export const Clippy = ({ monologue }: { monologue: string[] }) => {
  const clippyRef = useRef<Agent>();
  const monologueIndex = useRef(-1);

  const renderNextText = useCallback(() => {
    monologueIndex.current = monologueIndex.current + 1;
    if (monologueIndex.current === monologue.length) monologueIndex.current = 0;
    // Play random animation from array.
    clippyRef.current?.play(ANIMATIONS_LOOP[Math.floor(Math.random() * ANIMATIONS_LOOP.length)]);

    const newMonologue = monologue[monologueIndex.current] + FILLER_TO_LENGTHEN_DURATION;
    clippyRef.current?.speak(newMonologue, false);
  }, [monologue]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clippy.load({
      name: "Clippy",
      successCb: (agent: Agent) => {
        if (!clippyRef.current) {
          clippyRef.current = agent;
          clippyRef.current.show(false);

          renderNextText();
          interval = setInterval(() => {
            renderNextText();
          }, ANIMATION_INTERVAL);
        }
      },
    });

    return () => {
      clearInterval(interval);
      clippyRef.current?.hide(true, () => null);
      //No function to destroy it. We can destroy by classname
      document.querySelectorAll(".clippy, .clippy-balloon").forEach((item) => item.remove());
      clippyRef.current = undefined;
    };
  }, [renderNextText]);

  return null;
};
