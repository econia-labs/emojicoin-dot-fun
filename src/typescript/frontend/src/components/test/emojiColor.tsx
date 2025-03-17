"use client";

import { useEmojiPicker } from "context/emoji-picker-context";
import SearchBar from "../inputs/search-bar";
import React, { useEffect, useState } from "react";
import { getEmojiDominantColor } from "utils/color-utils/emoji-color-helpers";

export const EmojiColorTest = () => {
  const [color, setColor] = useState<{ hexString: string }[]>();

  const emojis = useEmojiPicker((s) => s.emojis);

  useEffect(() => {
    if (!emojis) setColor(undefined);

    const colors = emojis.map((e) => getEmojiDominantColor(e));
    if (colors) setColor(colors);
  }, [emojis]);

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
