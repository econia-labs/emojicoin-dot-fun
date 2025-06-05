import { useEmojiPicker } from "context/emoji-picker-context";
import { cn } from "lib/utils/class-name";
import Image from "next/image";
import { useEffect } from "react";

import icon from "../../../public/images/search-icon.svg";
import EmojiPickerWithInput from "../emoji-picker/EmojiPickerWithInput";
import { Flex } from "../layout";
import { InputGroup } from ".";

const searchIcon = <Image className="med-pixel-search" alt="search" src={icon} />;

const SearchBar = ({ className }: { className?: string }) => {
  const setMode = useEmojiPicker((state) => state.setMode);
  useEffect(() => {
    setMode("search");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  return (
    <div className={cn("m-0 flex w-full items-center p-0 md:w-auto", className)}>
      <div className="my-1.5 flex h-8 w-full items-center border border-solid border-dark-gray px-2 radii-lg md:w-auto">
        <div className="w-full px-1">
          <InputGroup
            variant="fantom"
            isShowError={false}
            forId="search"
            className="med-pixel-text"
            inputWrapperStyles={{ width: "100%" }}
          >
            <Flex width="100%">
              {searchIcon}
              <EmojiPickerWithInput
                handleClick={async () => {}}
                inputClassName="search-picker border-none"
              />
            </Flex>
          </InputGroup>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
