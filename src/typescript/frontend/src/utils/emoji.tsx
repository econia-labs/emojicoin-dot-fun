import { type AnyEmojiData, getEmojisInString } from "@sdk/index";
import { useEmojiFontClassName } from "lib/hooks/use-emoji-font-family";
import { cn } from "lib/utils/class-name";
import { useMemo, type DetailedHTMLProps, type HTMLAttributes } from "react";

export const Emoji = ({
  emojis,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  emojis: AnyEmojiData[] | string;
}) => {
  const emojiFontClassName = useEmojiFontClassName();

  const data = useMemo(
    () =>
      typeof emojis === "string"
        ? getEmojisInString(emojis).join("")
        : emojis.map((e) => e.emoji).join(""),
    [emojis]
  );

  return (
    <span
      {...props}
      className={cn(props.className, emojiFontClassName)}
      style={{ fontVariantEmoji: "emoji" }}
    >
      {data}
    </span>
  );
};
