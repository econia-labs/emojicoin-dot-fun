import AptosIconBlack from "@icons/AptosBlack";

export const AptosInputLabel = () => (
  <div className="pixel-heading-4 md:pixel-heading-3 text-light-gray">
    <AptosIconBlack className="mt-[5px] mr-[3px] h-[27px] w-[27px]" />
  </div>
);

export const EmojiInputLabel = ({ emoji }: { emoji: string }) => (
  <div className="pixel-heading-3 text-light-gray text-[24px] md:text-[30px] !leading-[34px] pt-[6px] cursor-default">
    {emoji}
  </div>
);
