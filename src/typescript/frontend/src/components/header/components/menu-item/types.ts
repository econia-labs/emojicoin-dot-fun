import { type TranslationKey } from "context/language-context/types";

export type MenuItemProps = {
  title: TranslationKey;
  width: string;
  onClick?: () => void;
};
