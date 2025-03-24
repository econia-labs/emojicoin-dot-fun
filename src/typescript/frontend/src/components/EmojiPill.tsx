import type { AnyEmojiName } from "@sdk/emoji_data/types";
import type { MouseEventHandler } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

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
        className={
          "px-[.7rem] py-[.2rem] border-[1px] border-solid rounded-full " +
          "border-dark-gray h-[1.5rem] w-fit cursor-pointer hover:bg-neutral-800"
        }
        onClick={onClick}
      >
        <Emoji className="mt-[.11rem]" emojis={emoji(emojiName)} />
      </div>
    </Popup>
  );
};
