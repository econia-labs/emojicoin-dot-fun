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
        className="flex justify-center items-center w-10 h-6 border border-dark-gray border-solid rounded-xl"
        onClick={onClick}
      >
        <Emoji emojis={emoji(emojiName)} />
      </div>
    </Popup>
  );
};
