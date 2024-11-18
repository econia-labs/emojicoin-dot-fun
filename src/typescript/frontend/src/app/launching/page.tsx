"use client";

import React, { useMemo } from "react";
import MatrixRain from "../maintenance/matrix";
import { useScramble } from "use-scramble";
import { Text } from "components";
import { getRandomChatEmoji } from "@sdk/emoji_data";

export default function LaunchingPage() {
  const catchPhrase = useMemo(() => {
    const phrases = ["launching soon", "get ready"];
    const index = Math.floor(Math.random() * phrases.length);
    const emoji = getRandomChatEmoji().emoji;
    return `${emoji} ${phrases[index]} ${emoji}`;
  }, []);
  const { ref } = useScramble({ text: catchPhrase });
  return (
    <div className="relative">
      <MatrixRain />
      <Text
        ref={ref}
        textScale="pixelHeading2"
        color="econiaBlue"
        textTransform="uppercase"
        className="fixed left-0 right-0 top-0 bottom-0 bg-black font-pixelar"
        style={{
          boxShadow: "0px 0px 30px 30px black",
          margin: "auto auto",
          width: "fit-content",
          height: "fit-content",
          fontSize: "7vw",
          lineHeight: "9vw",
        }}
      />
    </div>
  );
}
