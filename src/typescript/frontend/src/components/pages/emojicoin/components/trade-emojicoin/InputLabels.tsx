import { Emoji } from "utils/emoji";

import AptosIconBlack from "@/icons/AptosBlack";

export const AptosInputLabel = () => (
  <div className="text-light-gray pixel-heading-4 md:pixel-heading-3">
    <AptosIconBlack className="mr-[3px] mt-[5px] h-[27px] w-[27px]" />
  </div>
);

export const EmojiInputLabelStyles =
  "pixel-heading-4 md:pixel-heading-3 text-light-gray text-[24px] cursor-default break-keep";

export const EmojiInputLabel = ({ emoji }: { emoji: string }) => (
  <Emoji className={EmojiInputLabelStyles} emojis={emoji} />
);
