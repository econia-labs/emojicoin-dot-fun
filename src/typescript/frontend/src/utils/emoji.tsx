import { type AnyEmojiData, getEmojisInString } from "@sdk/index";
import { cn } from "lib/utils/class-name";
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
  const data = React.useMemo(
    () =>
      typeof emojis === "string"
        ? getEmojisInString(emojis).join("")
        : emojis.map((e) => e.emoji).join(""),
    [emojis]
  );

  return (
    <span
      {...props}
      className={cn(props.className, "text-[1em] font-noto-color-emoji")}
      style={{ fontVariantEmoji: "emoji" }}
    >
      {data}
    </span>
  );
};
