import { Flex } from "@/containers";
import { Text } from "components/text";
import { translationFunction } from "context/language-context";

export const EmojiNotFound = () => {
  const { t } = translationFunction();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Text textScale="display1" color={"warning"} textAlign="center" paddingY={100}>
        {t("Emoji not found.")} 😳
      </Text>
    </Flex>
  );
};
