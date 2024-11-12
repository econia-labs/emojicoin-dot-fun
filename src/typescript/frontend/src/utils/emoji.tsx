import { getEmojisInString, type SymbolEmojiData } from "@sdk/index";
import { type DetailedHTMLProps, type HTMLAttributes } from "react";

export const Emoji = ({
  children,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  children: SymbolEmojiData[] | string;
}) => {
  let data: React.ReactNode[] = [];
  if (typeof children === "string") {
    const emojis = getEmojisInString(children);
    data = emojis.map((e) => <em-emoji key={e} size="1em" native={e}></em-emoji>);
  } else {
    data = children.map((e) => <em-emoji key={e} size="1em" native={e.emoji}></em-emoji>);
  }
  return <span {...props}>{data}</span>;
};
