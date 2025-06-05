import type { MouseEventHandler } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import type { AnyEmojiName } from "@/sdk/emoji_data/types";

import Popup from "./popup";

export const EmojiPill = ({
  emoji: emojiName,
  description,
  onClick,
}: {
  emoji: AnyEmojiName;
  description: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) => {
  return (
    <Popup content={description}>
      <div
        className="flex h-6 w-10 items-center justify-center rounded-xl border border-solid border-dark-gray"
        onClick={onClick}
      >
        <Emoji emojis={emoji(emojiName)} />
      </div>
    </Popup>
  );
};
