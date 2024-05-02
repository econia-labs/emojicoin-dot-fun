import React, { useState } from "react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";

import { useThemeContext, useTranslation } from "context";
import { useValidationSchema } from "./hooks";
import { useForm, useTooltip } from "hooks";

import { Button, ClientsSlider, Column, Flex, FlexGap, Input, InputGroup, Text } from "components";
import { StyledEmojiPickerWrapper } from "./styled";

import { getTooltipStyles } from "./theme";

const LaunchEmojicoinPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeContext();

  const [emoji, setEmoji] = useState<EmojiClickData | null>(null);

  const { validationSchema, initialValues } = useValidationSchema();
  const { errors, touched, fieldProps, setFieldValue } = useForm({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit(values) {
      console.log("values", values);
    },
  });

  const { targetRef: targetRefLabel, tooltip: labelTooltip } = useTooltip(
    t("Pick one to five emojis; due to byte limitations not all combinations are supported."),
    {
      placement: "top",
    },
  );

  const { targetRef, tooltip } = useTooltip(
    <StyledEmojiPickerWrapper>
      <EmojiPicker
        searchPlaceholder={t("Search:")}
        onEmojiClick={emoji => onEmojiClickHandler(emoji)}
        theme={Theme.DARK}
        skinTonesDisabled
      />
    </StyledEmojiPickerWrapper>,
    {
      placement: "bottom",
      customStyles: getTooltipStyles(theme),
      trigger: "click",
    },
  );

  const onEmojiClickHandler = async (emoji: EmojiClickData) => {
    await setFieldValue("emoji", emoji.emoji);
    setEmoji(emoji);
    console.log("emoji", emoji);
  };

  return (
    <Column pt="120px" flexGrow="1">
      <ClientsSlider />

      <Flex justifyContent="center" alignItems="center" height="100%">
        <Column width="100%" maxWidth="414px">
          <Flex ref={targetRefLabel}>
            <InputGroup label={t("Select Emoji")} error={errors.emoji} isTouched={touched.emoji}>
              <Input {...fieldProps("emoji")} autoComplete="off" ref={targetRef} />
            </InputGroup>
            {labelTooltip}
          </Flex>
          {tooltip}

          <FlexGap gap="8px" mb="5px">
            <Text textScale="bodyLarge" color="lightGrey" textTransform="uppercase">
              {t("Emojicoin Name:")}
            </Text>
            <Text textScale="bodyLarge" textTransform="uppercase">
              {emoji ? emoji.names[0] : ""}
            </Text>
          </FlexGap>

          <FlexGap gap="8px" mb="5px">
            <Text textScale="bodyLarge" color="lightGrey" textTransform="uppercase">
              {t("Emojicoin symbol (ticker) :")}
            </Text>
            <Text textScale="bodyLarge" textTransform="uppercase">
              {emoji ? emoji.emoji : ""}
            </Text>
          </FlexGap>

          <Flex justifyContent="center">
            <Text textScale="pixelHeading4" color="darkGrey" textTransform="uppercase">
              {t("Cost to deploy:")}
            </Text>
          </Flex>

          <Flex justifyContent="center">
            <Button scale="lg">{t("Launch Emojicoin")}</Button>
          </Flex>
        </Column>
      </Flex>
    </Column>
  );
};
export default LaunchEmojicoinPage;
