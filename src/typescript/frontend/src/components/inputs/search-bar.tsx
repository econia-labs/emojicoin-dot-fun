import { EMOJI_GRID_ITEM_WIDTH } from "components/pages/home/components/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import Image from "next/image";
import { useEffect } from "react";
import styled from "styled-components";
import { breakpointsArray } from "theme/base";
import { DARK_GRAY } from "theme/colors";

import icon from "../../../public/images/search-icon.svg";
import EmojiPickerWithInput from "../emoji-picker/EmojiPickerWithInput";
import { Flex } from "../layout";
import { InputGroup } from ".";

const searchIcon = <Image className="med-pixel-search" alt="search" src={icon} />;

const Container = styled(Flex)`
  width: ${EMOJI_GRID_ITEM_WIDTH - 20}px;
  margin: 0;
  padding: 0;
  align-items: center;

  @media screen and (max-width: ${breakpointsArray[3]}) {
    width: 100%;
  }
`;

const Border = styled(Flex)`
  align-items: center;
  height: 33px;
  margin: 6px 0;
  padding: 0 0.5rem;
  border: 1px solid ${DARK_GRAY};
  border-radius: 2rem;
  @media screen and (max-width: ${breakpointsArray[3]}) {
    width: 100%;
  }
`;

const SearchBar = ({ className }: { className?: string }) => {
  const setMode = useEmojiPicker((state) => state.setMode);
  useEffect(() => {
    setMode("search");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);
  return (
    <Container className={className}>
      <Border>
        <div
          style={{
            padding: "0 5px",
            width: "100%",
          }}
        >
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
      </Border>
    </Container>
  );
};

export default SearchBar;
