import { InputGroup } from "components/inputs";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";
import Text from "components/text";
import { EMOJI_GRID_ITEM_WIDTH } from "../../const";
import { Flex } from "components/layout";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useEffect } from "react";
import icon from "../../../../../../../public/images/search-icon.svg";
import Image from "next/image";

const searchIcon = <Image className="med-pixel-search" alt="search" src={icon} />;

export const SearchComponent = () => {
  const setMode = useEmojiPicker((state) => state.setMode);
  useEffect(() => {
    setMode("home");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  return (
    <Flex
      style={{
        width: `${EMOJI_GRID_ITEM_WIDTH - 20}px`,
        margin: 0,
        padding: 0,
      }}
      alignItems="center"
    >
      <Text className="med-pixel-text" color="darkGray">
        {"{"}
      </Text>

      <div
        style={{
          padding: "0 5px",
          width: "100%",
        }}
      >
        <InputGroup variant="fantom" isShowError={false} forId="search" className="med-pixel-text">
          <Flex>
            {searchIcon}
            <EmojiPickerWithInput
              handleClick={async () => {}}
              pickerButtonClassName="top-[50px] left-[-87px] bg-black"
              inputClassName="home-picker ml-[4px] border-none"
            />
          </Flex>
        </InputGroup>
      </div>

      <Text className="med-pixel-text" color="darkGray">
        {"}"}
      </Text>
    </Flex>
  );
};

export default SearchComponent;
