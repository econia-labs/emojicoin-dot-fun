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
    <div className={cn("flex m-0 p-0 items-center w-full md:w-auto", className)}>
      <div className="w-full md:w-auto flex h-8 my-1.5 radii-lg px-2 items-center border-dark-gray border border-solid">
        <div className="px-1 w-full">
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
