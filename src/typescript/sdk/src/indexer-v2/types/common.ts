import { type EmojiName } from "../../emoji_data";
import { type OrderBy } from "../../queries/const";

export type DefaultQueryArgs = {
  page: number;
  limit?: number;
  orderBy?: OrderBy;
};

export type SearchEmojisQueryArgs = Omit<DefaultQueryArgs, "orderBy"> & {
  searchEmojis: string[];
};
