import { getEmojisInString, SymbolEmojiData } from "@sdk/index";
import { DetailedHTMLProps, HTMLAttributes } from "react";

export const Emoji = ({
  children,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  children: SymbolEmojiData[] | string;
}) => {
  let data: React.ReactNode[] = [];
  if (typeof children === "string") {
    const emojis = getEmojisInString(children);
    data = emojis.map((e) => <em-emoji size="1em" native={e}></em-emoji>);
  } else {
    data = children.map((e) => <em-emoji size="1em" native={e.emoji}></em-emoji>);
  }
  return <span {...props}>{data}</span>;
};
