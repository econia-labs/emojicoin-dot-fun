import { type TranslationKey } from "lib/utils/language";

export type MenuItemProps = {
  title: TranslationKey;
  onClick?: () => void;
  pill?: React.ReactNode;
};
