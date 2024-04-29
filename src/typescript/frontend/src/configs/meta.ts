import { TranslateFunction } from "context/language-context/types";
import { ROUTES } from "router/routes";
import { removeTrailingSlashIfExists } from "utils/pathname-helpers";

const URL = process.env.REACT_APP_URL;

export const getDefaultMeta = (t: TranslateFunction) => {
  return {
    title: t("Econia Labs"),
    description: t("Econia labs project is in progress"),
    image: `${URL}/logo512.png`,
    keywords: "aptos, tokens, emoji, emojicoins",
  };
};

export const getCustomMeta = (path: string, t: TranslateFunction) => {
  const basePath = removeTrailingSlashIfExists(path);

  switch (basePath) {
    case ROUTES.home: {
      return {
        ...getDefaultMeta(t),
        title: t("Home"),
      };
    }

    default:
      return {
        ...getDefaultMeta(t),
      };
  }
};
