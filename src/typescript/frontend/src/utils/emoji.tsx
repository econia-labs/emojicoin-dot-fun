import { type AnyEmojiData, getEmojisInString } from "@sdk/index";
import { type DetailedHTMLProps, type HTMLAttributes } from "react";

import * as React from "react";
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      "em-emoji": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        native?: string;
        key?: string;
        set?: string;
      };
    }
  }
}

export const Emoji = ({
  emojis,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  emojis: AnyEmojiData[] | string;
}) => {
  let data: React.ReactNode[] = [];
  if (typeof emojis === "string") {
    const emojisInString = getEmojisInString(emojis);
    data = emojisInString.map((e, i) => (
      <span
        className="text-[1em] font-noto-color-emoji"
        style={{ fontVariantEmoji: "emoji" }}
        key={`${emojisInString[i]}-${i}`}
      >
        {e}
      </span>
    ));
  } else {
    data = emojis.map((e, i) => (
      <span
        className="text-[1em] font-noto-color-emoji"
        style={{ fontVariantEmoji: "emoji" }}
        key={`${emojis[i].emoji}-${i}`}
      >
        {e.emoji}
      </span>
    ));
  }
  return <span {...props}>{data}</span>;
};
