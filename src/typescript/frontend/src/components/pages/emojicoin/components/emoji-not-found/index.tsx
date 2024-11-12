import { Flex } from "@containers";
import { Text } from "components/text";
import { translationFunction } from "context/language-context";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

export const EmojiNotFound = () => {
  const { t } = translationFunction();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Text textScale="display2" color={"warning"} textAlign="center" paddingY={100}>
        {t("Emoji not found.")} <Emoji>{emoji("flushed face")}</Emoji>
      </Text>
    </Flex>
  );
};
