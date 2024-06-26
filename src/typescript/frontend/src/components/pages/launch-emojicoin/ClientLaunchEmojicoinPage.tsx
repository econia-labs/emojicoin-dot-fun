"use client";
// cspell:word istouched

import React, { type ChangeEvent, useEffect, useState } from "react";
import { type EmojiClickData } from "emoji-picker-react";
import emojiRegex from "emoji-regex";

import { translationFunction } from "context/language-context";
import { useValidationSchema } from "./hooks";
import { useForm, useTooltip, useEmojicoinPicker } from "hooks";
import { isDisallowedEventKey } from "utils";

import Prompt from "components/prompt";
import { Input } from "components/inputs/input";
import { InputGroup } from "components/inputs/input-group";
import { Text } from "components/text";
import { Column, Flex, FlexGap } from "@containers";
import { StyledFieldName } from "./styled";
import { LaunchEmojicoinButton } from "./components/LaunchEmojicoinButton";
import { SYMBOL_DATA } from "@sdk/emoji_data/symbol-data";
import TextCarousel from "components/text-carousel/TextCarousel";
import { fetchLatestMarketState } from "lib/queries/initial/state";
import { symbolToEmojis } from "@sdk/emoji_data";

const ClientLaunchEmojicoinPage: React.FC = () => {
  const { t } = translationFunction();

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

  const names = values.emojiList.map((emoji) => symbolToEmojis(emoji.emoji)[0].name).join(", ");
  const tickers = values.emojiList.map((emoji) => emoji.emoji).join(", ");

  const [marketID, setMarketID] = useState<number>();

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

  const updateMarketID = (emojis: EmojiClickData[]) => {
    if (emojis.length === 0) {
      setMarketID(undefined);
    } else {
      const byteArray = emojis
        .map((e) => SYMBOL_DATA.byEmoji(e.emoji)!.hex.substring(2))
        .reduce((a, b) => `${a}${b}`);

      fetchLatestMarketState(byteArray).then((res) =>
        res ? setMarketID(res.marketID) : setMarketID(undefined)
      );
    }
  };

  const onEmojiClickHandler = async (emoji: EmojiClickData) => {
    const valueLength = values.emoji.match(emojiRegex())?.length ?? 0;
    if (valueLength < 5) {
      await setFieldValue("emoji", values.emoji + emoji.emoji);
      const newEmojiList = [...values.emojiList, emoji];
      await setFieldValue("emojiList", newEmojiList);
      updateMarketID(newEmojiList);
    } else {
      setMarketID(undefined);
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
    const newEmojiList = emojiArr.map((string) =>
      values.emojiList.find((item) => item.emoji === string)
    );

    if (values.emojiList.length > newEmojiList.length) {
      updateMarketID(newEmojiList as EmojiClickData[]);
    }
    await setFieldValue("emojiList", newEmojiList);
  };

  return (
    <Column pt="85px" flexGrow="1">
      <TextCarousel />

      <Flex justifyContent="center" alignItems="center" height="100%" px="24px">
        <Column width="100%" maxWidth="414px">
          <Flex position="relative">
            <Prompt text="Pick one to five emojis; due to byte limitations not all combinations are supported." />

            <InputGroup
              label={t("Select Emoji")}
              error={values.emoji.length > 0 ? errors.emoji : undefined}
              touched={touched.emoji}
              scale="xm"
            >
              <Input
                {...fieldProps("emoji")}
                onChange={onInputChange}
                autoComplete="off"
                ref={targetRef}
              />
            </InputGroup>
          </Flex>
          {tooltip}

          <FlexGap gap="8px" mb="5px">
            <StyledFieldName
              textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
              color="lightGray"
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
              color="lightGray"
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
            <Text textScale="pixelHeading4" color="darkGray" textTransform="uppercase">
              {t("Cost to deploy:")} ~1 APT
            </Text>
          </Flex>

          <Flex justifyContent="center" mt="18px">
            <LaunchEmojicoinButton
              emojis={values.emojiList.map((e) => SYMBOL_DATA.byEmoji(e.emoji)!.hex)}
              marketID={marketID}
              onCreate={(id) => {
                setMarketID(Number(id));
              }}
              disabled={
                values.emojiList.length === 0 ||
                Boolean(errors.emoji?.length) ||
                Boolean(errors.emojiList?.length)
              }
            />
          </Flex>
        </Column>
      </Flex>
    </Column>
  );
};

export default ClientLaunchEmojicoinPage;
