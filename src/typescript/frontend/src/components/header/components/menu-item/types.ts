import { type TranslationKey } from "context/language-context/types";

export type MenuItemProps = {
  title: TranslationKey;
  onClick?: () => void;
};
