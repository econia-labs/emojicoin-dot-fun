import React, { useEffect } from "react";
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

  const input = document.querySelector("input");

  const { validationSchema, initialValues } = useValidationSchema();
  const { values, errors, touched, fieldProps, setFieldValue } = useForm({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit(values) {
      console.log("values", values);
    },
  });

  const names = values.emojiList.map(emoji => emoji.names[0]).join(",");
  const tickers = values.emojiList.map(emoji => emoji.emoji).join(",");

  const { targetRef: targetRefLabel, tooltip: labelTooltip } = useTooltip(
    t("Pick one to five emojis; due to byte limitations not all combinations are supported."),
    {
      placement: "top",
    },
  );

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef, tooltip } = useTooltip(
    <StyledEmojiPickerWrapper>
      <EmojiPicker
        searchPlaceholder={t("Search:")}
        onEmojiClick={emoji => onEmojiClickHandler(emoji)}
        theme={Theme.DARK}
        skinTonesDisabled
        lazyLoadEmojis
      />
    </StyledEmojiPickerWrapper>,
    {
      placement: "bottom",
      customStyles: getTooltipStyles(theme),
      trigger: "click",
    },
  );

  const onEmojiClickHandler = async (emoji: EmojiClickData) => {
    await setFieldValue("emoji", values.emoji + emoji.emoji);
    await setFieldValue("emojiList", [...values.emojiList, emoji]);
  };

  const inputProhibition = async (event: KeyboardEvent) => {
    if (event.key !== "Backspace") {
      event.preventDefault();
    } else {
      const newEmojiValue = values.emoji.slice(0, -1);
      const newEmojiListValue = values.emojiList.slice(0, -1);
      await setFieldValue("emoji", newEmojiValue);
      await setFieldValue("emojiList", newEmojiListValue);
    }
  };

  const cursorPositioning = () => {
    input!.focus();
    input!.selectionStart = input!.value.length;
  };

  useEffect(() => {
    if (input) {
      input.addEventListener("keydown", inputProhibition);
      input.addEventListener("click", cursorPositioning);
    }

    return () => {
      if (input) {
        input.removeEventListener("keydown", inputProhibition);
        input.removeEventListener("click", cursorPositioning);
      }
    };
  }, [input, values]);

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
            <Text textScale="bodyLarge" textTransform="uppercase" ellipsis ref={targetRefEmojiName}>
              {names}
            </Text>
            {tooltipEmojiName}
          </FlexGap>

          <FlexGap gap="8px" mb="5px">
            <Text textScale="bodyLarge" color="lightGrey" textTransform="uppercase">
              {t("Emojicoin symbol (ticker) :")}
            </Text>
            <Text textScale="bodyLarge" textTransform="uppercase">
              {tickers}
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
