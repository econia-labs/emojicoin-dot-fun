"use client";

import { InputGroup, Input } from "components/inputs";
import { isDisallowedEventKey } from "utils";

export const SearchComponent = () => {
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
        className="med-pixel-text"
      >
        <Input
          className="med-pixel-text"
          id="search"
          autoComplete="off"
          onKeyDown={onInputChange}
        />
      </InputGroup>
      {"TODO"}
    </>
  );
};

export default SearchComponent;
