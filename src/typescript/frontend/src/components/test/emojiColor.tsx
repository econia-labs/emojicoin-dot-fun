"use client";

import { useEmojiPicker } from "context/emoji-picker-context";
import SearchBar from "../inputs/search-bar";
import React, { useEffect, useState } from "react";
import { CHAT_EMOJIS, SYMBOL_EMOJIS } from "@econia-labs/emojicoin-sdk";

export const EmojiColorTest = () => {
  const [color, setColor] = useState<{ hexString: string }[]>();

  const emojis = useEmojiPicker((s) => s.emojis);

  useEffect(() => {
    if (!emojis) setColor(undefined);

    const colors = emojis.map((e) => getEmojiDominantColor(e));
    if (colors) setColor(colors);
  }, [emojis]);

  useEffect(() => {
    const colorsMap = new Map<string, { r: number; g: number; b: number }>();
    const allEmojis = [...Object.keys(CHAT_EMOJIS), ...Object.keys(SYMBOL_EMOJIS)];
    for (const emoji of allEmojis) {
      const { rgb } = getEmojiDominantColor(emoji);
      colorsMap.set(emoji, rgb);
    }

    // Convert Map to a plain object for JSON serialization
    const colorsObject = Object.fromEntries(colorsMap);

    // Convert to JSON string
    const jsonData = JSON.stringify(colorsObject, null, 2);
    console.log(jsonData);
  }, []);

  return (
    <div className="flex flex-col items-center gap-y-4">
      <SearchBar />
      <div className="flex flex-row items-center gap-2">
        {color?.map((col, i) => {
          return (
            <div key={i}>
              <div className="w-[50px] h-[50px]" style={{ backgroundColor: col.hexString }} />
              <span>{col.hexString}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
