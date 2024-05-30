import * as yup from "yup";

import { type InitialValues } from "./types";
import { translationFunction } from "context/language-context";
import { SYMBOL_DATA } from "@sdk/emoji_data";

const useValidationSchema = () => {
  const initialValues: InitialValues = {
    emoji: "",
    emojiList: [],
  };

  const { t } = translationFunction();

  const validationSchema = yup.object().shape({
    emoji: yup.string().test("emoji", `${t("Byte limit reached")}`, (value) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(value);
      return bytes.length <= 10 && SYMBOL_DATA.hasHex(bytes);
    }),
  });

  return { validationSchema, initialValues };
};

export default useValidationSchema;
