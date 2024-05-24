"use client";

import { InputGroup, Input } from "components/inputs";
import { useEmojicoinPicker } from "hooks";
import { isDisallowedEventKey } from "utils";

export const SearchComponent = () => {
  const { targetRef, tooltip } = useEmojicoinPicker({
    onEmojiClick: () => {},
    placement: "bottom",
    width: 272,
  });

  const onInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  return (
    <>
      <InputGroup
        label="Search:"
        textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
        variant="fantom"
        forId="search"
        isShowError={false}
      >
        <Input className="med-pixel-text" id="search" autoComplete="off" onKeyDown={onInputChange} ref={targetRef} />
      </InputGroup>
      {tooltip}
    </>
  );
};

export default SearchComponent;
