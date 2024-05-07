import React, { ChangeEvent, useEffect } from "react";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import emojiRegex from "emoji-regex";

import { useThemeContext, useTranslation } from "context";
import { useValidationSchema } from "./hooks";
import { useForm, useTooltip } from "hooks";

import { Button, ClientsSlider, Column, Flex, FlexGap, Input, InputGroup, Text, Prompt } from "components";
import { StyledEmojiPickerWrapper, StyledFieldName } from "./styled";

import { getTooltipStyles } from "./theme";

const LaunchEmojicoinPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeContext();

  const { validationSchema, initialValues } = useValidationSchema();
  const { values, errors, touched, fieldProps, setFieldValue } = useForm({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit(values) {
      /* eslint-disable-next-line no-console */
      console.log("values", values);
    },
  });

  const names = values.emojiList.map(emoji => emoji.names[0]).join(", ");
  const tickers = values.emojiList.map(emoji => emoji.emoji).join(", ");

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef: targetRefEmojiTicker, tooltip: tooltipEmojiTicker } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
    customStyles: {
      tooltip: {
        lineHeight: "normal",
      },
    },
  });

  const { targetRef, tooltip, targetElement } = useTooltip(
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
    if (event.key !== "Backspace" && event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (targetElement) {
      targetElement.addEventListener("keydown", inputProhibition);
    }

    return () => {
      if (targetElement) {
        targetElement.removeEventListener("keydown", inputProhibition);
      }
    };
  }, [targetElement, values]);

  const onInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    fieldProps("emoji").onChange(e);

    const emojiArr = e.target.value.match(emojiRegex()) ?? [];
    const newEmojiList = emojiArr.map(string => values.emojiList.find(item => item.emoji === string));

    await setFieldValue("emojiList", newEmojiList);
  };

  return (
    <Column pt="120px" flexGrow="1">
      <ClientsSlider />

      <Flex justifyContent="center" alignItems="center" height="100%">
        <Column width="100%" maxWidth="414px">
          <Flex position="relative">
            <Prompt text="Pick one to five emojis; due to byte limitations not all combinations are supported." />

            <InputGroup label={t("Select Emoji")} error={errors.emoji} isTouched={touched.emoji}>
              <Input {...fieldProps("emoji")} onChange={onInputChange} autoComplete="off" ref={targetRef} />
            </InputGroup>
          </Flex>
          {tooltip}

          <FlexGap gap="8px" mb="5px">
            <StyledFieldName textScale="bodyLarge" color="lightGrey" textTransform="uppercase">
              {t("Emojicoin Name:")}
            </StyledFieldName>
            <Text textScale="bodyLarge" textTransform="uppercase" ellipsis ref={targetRefEmojiName}>
              {names}
            </Text>
            {tooltipEmojiName}
          </FlexGap>

          <FlexGap gap="8px" mb="5px">
            <StyledFieldName textScale="bodyLarge" color="lightGrey" textTransform="uppercase">
              {t("Emojicoin symbol (ticker) :")}
            </StyledFieldName>
            <Text textScale="bodyLarge" textTransform="uppercase" ellipsis ref={targetRefEmojiTicker}>
              {tickers}
            </Text>
            {tooltipEmojiTicker}
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
