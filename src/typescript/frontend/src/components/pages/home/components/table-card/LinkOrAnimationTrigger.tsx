import { type SymbolEmojiData } from "@sdk/emoji_data/types";
import { useGenerateEvent } from "../../test-generate-event/use-generate-event";
import { type PropsWithChildren } from "react";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";
import Link from "next/link";
import { VERCEL } from "@sdk/const";

export const LinkOrAnimationTrigger = ({
  emojis,
  marketID,
  ...props
}: { emojis: SymbolEmojiData[]; marketID: number } & PropsWithChildren) => {
  const generateEvent = useGenerateEvent({ marketID, emojis, stateOnly: true });

  return (
    <>
      {VERCEL ||
      process.env.NODE_ENV !== "development" ||
      process.env.NEXT_PUBLIC_ANIMATION_TEST !== "true" ? (
        <Link href={`${ROUTES.market}/${emojiNamesToPath(emojis.map((x) => x.name))}`}>
          {props.children}
        </Link>
      ) : (
        <div onClick={generateEvent}>{props.children}</div>
      )}
    </>
  );
};

export default LinkOrAnimationTrigger;
