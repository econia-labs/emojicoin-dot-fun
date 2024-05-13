import { EmojiClickData } from "emoji-picker-react";
import { Placement } from "@popperjs/core";

export type useEmojicoinPickerProps = {
  onEmojiClick: (emoji: EmojiClickData) => void;
  placement?: Placement;
  autoFocusSearch?: boolean;
  width?: number;
};
