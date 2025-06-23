import { Emoji } from "utils/emoji";
import { emojiNamesToPath } from "utils/pathname-helpers";

import { Link } from "@/components/link";
import Popup from "@/components/popup";
import type { SymbolEmojiData } from "@/sdk/index";

export const EmojiWithMarketLink = ({ emojis }: { emojis: SymbolEmojiData[] }) => (
  <Popup content="go to market">
    <Link href={`/market/${emojiNamesToPath(emojis.map((e) => e.name))}`}>
      <div className="flex w-20 justify-between cursor-pointer font-pixelar font-sm text-ec-blue group-aria-selected:text-black">
        <div>{"{"}</div>
        <Emoji emojis={emojis} />
        <div>{"}"}</div>
      </div>
    </Link>
  </Popup>
);
