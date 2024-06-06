import AptosIconBlack from "@icons/AptosBlack";
import { Text } from "components";

export const AptosInputLabel = () => (
  <Text textScale={{ _: "pixelHeading4", tablet: "pixelHeading3" }} color="lightGray">
    <AptosIconBlack style={{ marginTop: 5, marginRight: 3 }} height="27px" width="27px" />
  </Text>
);

export const EmojiInputLabel = ({ emoji }: { emoji: string }) => (
  <Text
    textScale="pixelHeading3"
    fontSize={{ _: "24px", tablet: "30px" }}
    lineHeight="34px"
    pt="6px"
    color="lightGray"
    style={{
      cursor: "default",
    }}
  >
    {emoji}
  </Text>
);
