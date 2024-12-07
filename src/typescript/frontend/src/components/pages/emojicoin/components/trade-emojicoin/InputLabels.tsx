import AptosIconBlack from "@icons/AptosBlack";
import { Emoji } from "utils/emoji";

export const AptosInputLabel = () => (
  <div className="pixel-heading-4 md:pixel-heading-3 text-light-gray">
    <AptosIconBlack className="mt-[5px] mr-[3px] h-[27px] w-[27px]" />
  </div>
);

export const EmojiInputLabelStyles =
  "pixel-heading-4 md:pixel-heading-3 text-light-gray text-[24px] cursor-default break-keep";

export const EmojiInputLabel = ({ emoji }: { emoji: string }) => (
  <Emoji className={EmojiInputLabelStyles} emojis={emoji} />
);
