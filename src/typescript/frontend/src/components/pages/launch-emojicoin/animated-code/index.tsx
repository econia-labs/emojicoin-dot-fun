"use client";

import { type AnimationSequence, useAnimate } from "framer-motion";
import { cn } from "lib/utils/class-name";
import { useEffect, useMemo, useState } from "react";
import { getAllSpanTextInCode, getCode, type CodeObjectType } from "./get-code";
import { useScramble } from "use-scramble";

const getClassName = (i: number) => `c-${i + 1}`;
const emptyFunction = () => {};

const useCodeAnimator = (code: string, animationEndCallback: () => void = emptyFunction) => {
  const [scope, animate] = useAnimate();
  const sequence: AnimationSequence = useMemo(
    () =>
      [...code].map((_, i) => [
        `.${getClassName(i)}`,
        {
          opacity: [0, 1],
          scale: [0, 1],
          y: [Math.random() * 10, 0],
        },
        {
          duration: 0,
          delay: Math.random() * 0.005,
        },
      ]),
    [code]
  );

  console.log(sequence);

  useEffect(() => {
    animate(sequence).then(animationEndCallback);
    /* eslint-disable-next-line */
  }, []);

  return scope;
};

const getTextAndColor = (value: CodeObjectType[keyof CodeObjectType]) => {
  if (Array.isArray(value)) {
    return {
      text: value[0],
      color: value[1],
    };
  }
  return {
    text: value,
    color: "",
  };
};

const CHARS = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789//_[];(){}=, /!@^&*`<>-+|.",
];

export const ScrambledChar = ({ char, i, offset }: { char: string; i: number; offset: number }) => {
  const [displayedChar, setDisplayedChar] = useState(char);
  useEffect(() => {
    // const interval = setInterval(() => {
    //   const idx = Math.floor(Math.random() * CHARS.length);
    //   setDisplayedChar(CHARS.at(idx)!);
    // }, Math.random() * 10);

    // const timer = setTimeout(
    //   () => {
    //     setDisplayedChar(char);
    //     clearInterval(interval);
    //   },
    //   (i + offset) * 10
    // );

    // return () => {
    //   clearInterval(interval);
    //   clearTimeout(timer);
    // };
  }, []);

  return (
    <span className={getClassName(i + offset)} style={{ opacity: 0, scale: 1 }}>
      {displayedChar === " " ? <>&nbsp;</> : displayedChar}
    </span>
  );
};

export function AnimatedLineOfCode({
  code,
  field,
}: {
  code: CodeObjectType;
  field: keyof CodeObjectType;
}) {
  const { colorClass, chars, offset } = useMemo(() => {
    const keys = Object.keys(code) as (keyof CodeObjectType)[];

    let length = 0;
    let colorClass = "";
    const chars: string[] = [];
    for (const key of keys) {
      const { text, color } = getTextAndColor(code[key]);
      if (key === field) {
        chars.push(...text);
        colorClass = color;
        break;
      }
      length += text.length;
    }
    return { colorClass, chars, offset: length };
  }, [code, field]);

  return (
    <div className={colorClass ? cn(colorClass, "inline-block") : "inline-block"}>
      {chars.map((char, i) => (
        <ScrambledChar key={getClassName(i + offset)} char={char} i={i} offset={offset} />
      ))}
    </div>
  );
}

const tab = "ml-[2ch]";

export const AnimatedRegisterMarketCode = ({
  address,
  emojis,
  animationEndCallback,
}: {
  address: `0x${string}`;
  emojis: string[];
  animationEndCallback?: () => void;
}) => {
  const { code, codeString } = useMemo(
    () => {
      const code = getCode(address, emojis);
      const codeString = getAllSpanTextInCode(code);
      return { code, codeString };
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  const scope = useCodeAnimator(codeString, animationEndCallback);

  return (
    <div
      ref={scope}
      className="relative flex flex-col gap-1 justify-start font-pixelar text-white"
    >
      <>
        <div>
          <AnimatedLineOfCode code={code} field="publicEntryFun" />
          <AnimatedLineOfCode code={code} field="registerMarket" />
          <AnimatedLineOfCode code={code} field="parenOpen" />
        </div>
        <div className={tab}>
          <AnimatedLineOfCode code={code} field="registrant" />
          <AnimatedLineOfCode code={code} field="address" />
          <AnimatedLineOfCode code={code} field="comma" />
        </div>
        <div className={tab}>
          <AnimatedLineOfCode code={code} field="emojisField" />
          <AnimatedLineOfCode code={code} field="bytes" />
          <AnimatedLineOfCode code={code} field="comma2" />
        </div>
        <div>
          <AnimatedLineOfCode code={code} field="parenClose" />
          <AnimatedLineOfCode code={code} field="acquires" />
          <AnimatedLineOfCode code={code} field="acquiresValues" />
          <AnimatedLineOfCode code={code} field="leftBrace" />
        </div>
        <div className={tab}>
          <AnimatedLineOfCode code={code} field="comment1" />
          <div>
            <AnimatedLineOfCode code={code} field="let2" />
            <AnimatedLineOfCode code={code} field="emojiBytes" />
            <AnimatedLineOfCode code={code} field="equals" />
            <AnimatedLineOfCode code={code} field="getVerifiedBytes" />
            <AnimatedLineOfCode code={code} field="parenOpen2" />
            <AnimatedLineOfCode code={code} field="getVerifiedBytesArgs" />
            <AnimatedLineOfCode code={code} field="parenClose2" />
            <AnimatedLineOfCode code={code} field="semicolon2" />
          </div>
          <AnimatedLineOfCode code={code} field="comment2" />
          <div>
            <AnimatedLineOfCode code={code} field="let3" />
            <AnimatedLineOfCode code={code} field="notRegistered" />
            <AnimatedLineOfCode code={code} field="checkMarkets" />
            <AnimatedLineOfCode code={code} field="parenMarketsL" />
            <AnimatedLineOfCode code={code} field="emojiBytes2" />
            <AnimatedLineOfCode code={code} field="parenMarketsR" />
            <AnimatedLineOfCode code={code} field="semicolon3" />
          </div>
          <div>
            <AnimatedLineOfCode code={code} field="assert" />
            <AnimatedLineOfCode code={code} field="parenOpen4" />
            <AnimatedLineOfCode code={code} field="notRegistered2" />
            <AnimatedLineOfCode code={code} field="comma4" />
            <AnimatedLineOfCode code={code} field="eAlreadyRegistered" />
            <AnimatedLineOfCode code={code} field="parenClose4" />
            <AnimatedLineOfCode code={code} field="semicolon4" />
          </div>
          <AnimatedLineOfCode code={code} field="comment3" />
          <div>
            <AnimatedLineOfCode code={code} field="let4" />
            <AnimatedLineOfCode code={code} field="parenOpen5" />
            <AnimatedLineOfCode code={code} field="hexCodeReturn" />
            <AnimatedLineOfCode code={code} field="parenClose5" />
            <AnimatedLineOfCode code={code} field="equals2" />
          </div>
          <div className={tab}>
            <AnimatedLineOfCode code={code} field="hexCodes" />
            <AnimatedLineOfCode code={code} field="getPublishCode" />
            <AnimatedLineOfCode code={code} field="parenOpen6" />
            <AnimatedLineOfCode code={code} field="marketAddress" />
            <AnimatedLineOfCode code={code} field="parenClose6" />
            <AnimatedLineOfCode code={code} field="semicolon5" />
          </div>

          <div>
            <AnimatedLineOfCode code={code} field="codeModule" />
            <AnimatedLineOfCode code={code} field="publishPackageTxn" />
            <AnimatedLineOfCode code={code} field="parenOpen7" />
          </div>
          <div className={tab}>
            <AnimatedLineOfCode code={code} field="registry" />
          </div>
          <div className={tab}>
            <AnimatedLineOfCode code={code} field="metadata" />
          </div>
          <div className={tab}>
            <AnimatedLineOfCode code={code} field="vector" />
            <AnimatedLineOfCode code={code} field="bracket1" />
            <AnimatedLineOfCode code={code} field="moduleBytecode2" />
            <AnimatedLineOfCode code={code} field="bracket2" />
          </div>
          <div>
            <AnimatedLineOfCode code={code} field="parenClose7" />
            <AnimatedLineOfCode code={code} field="semicolon6" />
          </div>
        </div>
        <AnimatedLineOfCode code={code} field="rightBrace" />
      </>
    </div>
  );
};
