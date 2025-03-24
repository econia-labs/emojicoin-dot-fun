// cspell:word shortcodes
export type EmojiMartData = {
  categories: {
    id: string;
    emojis: string[];
  }[];
  emojis: {
    [key: string]: {
      id: string;
      name: string;
      keywords: string[];
      skins: {
        unified: string;
        native: string;
      }[];
      version: number;
    };
  };
  aliases: {
    [key: string]: string;
  };
  sheet: {
    cols: number;
    rows: number;
  };
};

export type EmojiPickerSearchData = {
  id: string;
  keywords: string[];
  name: string;
  search: string; // e.g. ",smirk,smirking,face,smirk,smile,mean,prank,smug,sarcasm,😏"
  skins: Array<{
    unified: string;
    native: string;
    shortcodes: string;
  }>;
  version: number;
  emoticons?: string[];
};

export type EmojiSelectorData = {
  id: string;
  keywords: string[];
  name: string;
  native: string;
  shortcodes: string;
  skin: number;
  unified: `${string}` | `${string}-${string}`;
};
