import { type SymbolEmojiData } from "@sdk/emoji_data/types";
import Link from "next/link";
import { type PropsWithChildren } from "react";
import React from "react";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";

export const EmojiMarketPageLink = ({
  emojis,
  ...props
}: { emojis: SymbolEmojiData[] } & PropsWithChildren) => (
  <Link href={`${ROUTES.market}/${emojiNamesToPath(emojis.map((x) => x.name))}`}>
    {props.children}
  </Link>
);

export default React.memo(EmojiMarketPageLink);
