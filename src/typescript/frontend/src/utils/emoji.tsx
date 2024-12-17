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
  set = undefined,
  size = undefined,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  emojis: AnyEmojiData[] | string;
  set?: string;
  size?: string;
}) => {
  let data: React.ReactNode[] = [];
  if (typeof emojis === "string") {
    const emojisInString = getEmojisInString(emojis);
    data = emojisInString.map((e, i) => (
      <em-emoji
        key={`${emojisInString[i]}-${i}`}
        size={size ?? "1em"}
        native={e}
        set={set}
      ></em-emoji>
    ));
  } else {
    data = emojis.map((e, i) => (
      <em-emoji key={`${emojis[i].emoji}-${i}`} size={size ?? "1em"} native={e.emoji}></em-emoji>
    ));
  }
  return <span {...props}>{data}</span>;
};
