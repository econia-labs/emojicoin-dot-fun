import { type AnyEmoji } from "@sdk/emoji_data/types";

export const ServerSideEmoji = ({
  emojis,
  emojiFontClassName,
}: {
  emojis: string | AnyEmoji[];
  emojiFontClassName: string;
}) => (
  <span className={emojiFontClassName} style={{ fontVariantEmoji: "emoji", display: "inline" }}>
    {Array.isArray(emojis) ? emojis.join("") : emojis}
  </span>
);
