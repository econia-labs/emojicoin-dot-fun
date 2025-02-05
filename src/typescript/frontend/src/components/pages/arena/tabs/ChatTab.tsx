import { emoji } from "utils";
import { Emoji } from "utils/emoji";

export const ChatTab = () => (
  <div className="text-ec-blue text-center text-5xl grid place-items-center h-[100%]">
    <Emoji
      emojis={`${emoji("folded hands")}${emoji("cross mark")}${emoji("fire")}${emoji("pleading face")}`}
    />
  </div>
);
