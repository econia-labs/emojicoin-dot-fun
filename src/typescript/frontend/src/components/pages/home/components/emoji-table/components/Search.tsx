import { InputGroup } from "components/inputs";
import EmojiPickerWithInput from "components/emoji-picker/EmojiPickerWithInput";

export const SearchComponent = () => {
  return (
    <>
      <InputGroup
        textScale="pixelHeading3"
        variant="fantom"
        width="unset"
        isShowError={false}
        label="Search:"
        forId="search"
      >
        <EmojiPickerWithInput
          handleClick={async () => {}}
          pickerButtonClassName="top-[50px] left-[-87px] bg-black"
          inputClassName="!w-[175px] ml-[4px] border-none"
        />
      </InputGroup>
    </>
  );
};

export default SearchComponent;
