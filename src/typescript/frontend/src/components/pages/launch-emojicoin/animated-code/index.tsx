import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { normalizeHex, truncateAddress } from "@sdk/utils";
import useInputStore from "@store/input-store";
import { type AnimationSequence, stagger, useAnimate } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const getClassName = (i: number) => `character-${i + 1}`;

const wordsPerMinute = 600;

const useCodeAnimator = (code: string, onAnimationEnd: () => void) => {
  const [scope, animate] = useAnimate();
  const sequence: AnimationSequence = useMemo(
    () =>
      [...code].map((_, i) => [
        `.${getClassName(i)}`,
        {
          //   opacity: [0, 1],
          opacity: [0, 1],
          scale: [0, 1],
          //   scale: [1, 1.5, 1],
        },
        {
          duration: 0,
          delay: Math.random() * 0.05,
        },
      ]),
    [code]
  );

  useEffect(() => {
    animate(sequence).then(onAnimationEnd);
    /* eslint-disable-next-line */
  }, []);

  return scope;
};

export function AnimatedLineOfCode<T extends { [s: string]: string }>({
  className = "",
  code,
  field,
}: {
  className?: string;
  code: T;
  field: keyof T;
}) {
  const keys = Object.keys(code) as (keyof T)[];
  const values = Object.values(code) as string[];
  const idx = keys.findIndex((key) => key === field);
  const offset = values.slice(0, idx).join("").length;
  const chars = [...values[idx]];

  return (
    <div className={className + " inline-block"}>
      {chars.map((char, i) => (
        <span
          key={getClassName(i + offset)}
          className={getClassName(i + offset)}
          style={{ opacity: 0, scale: 1 }}
        >
          {char === " " ? <>&nbsp;</> : char}
        </span>
      ))}
    </div>
  );
}

export const AnimatedRegisterMarketCode = ({
  address,
  onAnimationEnd,
  emojis,
}: {
  address: string;
  onAnimationEnd: () => void;
  emojis: string[];
}) => {
  const code = useMemo(
    () => ({
      publicEntryFun: "public entry fun ",
      registerMarket: "register_market",
      parenOpen: "(",
      registrant: "registrant: ",
      address: `0x${address.slice(2).toUpperCase()}`,
      comma: ",",
      emojisField: "emojis: ",
      emojiBytes: `0x${normalizeHex(new TextEncoder().encode(emojis.join("")))
        .slice(2)
        .toUpperCase()}`,
      comma2: ",",
      parenClose: ");",
    }),
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  const scope = useCodeAnimator(Object.values(code).join(""), onAnimationEnd);

  return (
    <div
      ref={scope}
      className="relative flex flex-col gap-1 justify-start pixel-heading-3b text-white"
    >
      <>
        <div>
          <AnimatedLineOfCode className="text-ec-blue" code={code} field={"publicEntryFun"} />
          <AnimatedLineOfCode className="text-pink" code={code} field={"registerMarket"} />
          <AnimatedLineOfCode code={code} field={"parenOpen"} />
        </div>
        <div className="ml-[4ch]">
          <AnimatedLineOfCode code={code} field={"registrant"} />
          <AnimatedLineOfCode className="text-yellow-300" code={code} field={"address"} />
          <AnimatedLineOfCode code={code} field={"comma"} />
        </div>
        <div className="ml-[4ch]">
          <AnimatedLineOfCode code={code} field={"emojisField"} />
          <AnimatedLineOfCode className="text-yellow-300" code={code} field={"emojiBytes"} />
          <AnimatedLineOfCode code={code} field={"comma2"} />
        </div>
        <AnimatedLineOfCode code={code} field={"parenClose"} />
      </>
    </div>
  );
};
