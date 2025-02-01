import { useEffect, useRef } from "react";
import clippy, { type Agent } from "clippyts";
import "./clippy.css";

const ANIMATIONS_LOOP = ["Greeting", "Processing", "IdleAtom", "Congratulate"];

export const Clippy = ({ monologue }: { monologue: string[] }) => {
  const clippyRef = useRef<Agent>();
  const monologueIndex = useRef(-1);

  const renderNextText = () => {
    monologueIndex.current = monologueIndex.current + 1;
    if (monologueIndex.current === monologue.length) monologueIndex.current = 0;
    //Play random animation from array
    clippyRef.current?.play(ANIMATIONS_LOOP[Math.floor(Math.random() * ANIMATIONS_LOOP.length)]);
    clippyRef.current?.speak(monologue[monologueIndex.current], false);
  };

  useEffect(() => {
    clippy.load({
      name: "Clippy",
      successCb: (agent: Agent) => {
        if (!clippyRef.current) {
          clippyRef.current = agent;
          clippyRef.current.show(false);

          renderNextText();
          setInterval(() => {
            renderNextText();
          }, 6000);
        }
      },
    });

    return () => {
      clippyRef.current?.hide(true, () => null);
      //No function to detroy it. We can destroy by classname
      document.querySelectorAll(".clippy, .clippy-balloon").forEach((item) => item.remove());
      clippyRef.current = undefined;
    };
  }, []);

  return null;
};
