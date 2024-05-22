"use client";

import React, { type ChangeEvent, useEffect } from "react";
import { type EmojiClickData } from "emoji-picker-react";
import emojiRegex from "emoji-regex";

import { useTranslation } from "context";
import { useValidationSchema } from "./hooks";
import { useForm, useTooltip, useEmojicoinPicker } from "hooks";
import { isDisallowedEventKey } from "utils";

import Prompt from "components/prompt";
import { Input } from "components/inputs/input";
import { InputGroup } from "components/inputs/input-group";
import { Text } from "components/text";
import Button from "components/button";
import ClientsSlider from "components/clients-slider";
import { Column, Flex, FlexGap } from "@/containers";
import { StyledFieldName } from "./styled";

const LaunchEmojicoin: React.FC = () => {
  const { t } = useTranslation();

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

  const onEmojiClickHandler = async (emoji: EmojiClickData) => {
    const valueLength = values.emoji.match(emojiRegex())?.length ?? 0;
    if (valueLength < 5) {
      await setFieldValue("emoji", values.emoji + emoji.emoji);
      await setFieldValue("emojiList", [...values.emojiList, emoji]);
    }
  };

  const { targetRef, tooltip, targetElement } = useEmojicoinPicker({
    onEmojiClick: onEmojiClickHandler,
    placement: "bottom",
    width: 272,
  });

  const inputProhibition = async (event: KeyboardEvent) => {
    if (isDisallowedEventKey(event)) {
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
    <Column pt="85px" flexGrow="1">
      <ClientsSlider />

      <Flex justifyContent="center" alignItems="center" height="100%" px="24px">
        <Column width="100%" maxWidth="414px">
          <Flex position="relative">
            <Prompt text="Pick one to five emojis; due to byte limitations not all combinations are supported." />

            <InputGroup label={t("Select Emoji")} error={errors.emoji} isTouched={touched.emoji} scale="xm">
              <Input {...fieldProps("emoji")} onChange={onInputChange} autoComplete="off" ref={targetRef} />
            </InputGroup>
          </Flex>
          {tooltip}

          <FlexGap gap="8px" mb="5px">
            <StyledFieldName
              textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
              color="lightGrey"
              textTransform="uppercase"
            >
              {t("Emojicoin Name:")}
            </StyledFieldName>
            <Text
              textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
              textTransform="uppercase"
              ellipsis
              ref={targetRefEmojiName}
            >
              {names}
            </Text>
            {tooltipEmojiName}
          </FlexGap>

          <FlexGap gap="8px" mb="5px">
            <StyledFieldName
              textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
              color="lightGrey"
              textTransform="uppercase"
            >
              {t("Emojicoin symbol (ticker) :")}
            </StyledFieldName>
            <Text
              textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
              textTransform="uppercase"
              lineHeight="20px"
              ellipsis
              ref={targetRefEmojiTicker}
            >
              {tickers}
            </Text>
            {tooltipEmojiTicker}
          </FlexGap>

          <Flex justifyContent="center">
            <Text textScale="pixelHeading4" color="darkGrey" textTransform="uppercase">
              {t("Cost to deploy:")}
            </Text>
          </Flex>

          <Flex justifyContent="center" mt="18px">
            <Button scale="lg">{t("Launch Emojicoin")}</Button>
          </Flex>
        </Column>
      </Flex>
    </Column>
  );
};

export default LaunchEmojicoin;
