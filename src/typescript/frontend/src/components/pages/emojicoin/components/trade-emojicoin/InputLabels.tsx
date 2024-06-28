import AptosIconBlack from "@icons/AptosBlack";

export const AptosInputLabel = () => (
  <div className="pixel-heading-4 md:pixel-heading-3 text-light-gray">
    <AptosIconBlack className="h-[30px] w-[30px] mt-[5px] mb-[5px]" />
  </div>
);

export const EmojiInputLabel = ({ emoji }: { emoji: string }) => (
  <div className="pixel-heading-3 text-light-gray text-[30px] md:text-[30px] !leading-[40px] cursor-default">
    {emoji}
  </div>
);
