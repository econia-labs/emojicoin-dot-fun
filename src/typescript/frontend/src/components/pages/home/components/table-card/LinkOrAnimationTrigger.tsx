import { type SymbolEmojiData } from "@sdk/emoji_data/types";
import { useGenerateEvent } from "../../test-generate-event/use-generate-event";
import { type PropsWithChildren } from "react";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";
import Link from "next/link";
import { VERCEL } from "@sdk/const";

/**
 * To facilitate easy visual testing, we swap out the link on the grid table card with a div that triggers a
 * random event when clicked. Note that the test click div will never render in Vercel build mode or in
 * production. You also have to set a specific environment variable to true.
 *
 * We put this component in the grid table card component so that when the user clicks on the card, it will
 * trigger the event (or navigate to the market page if not in test mode).
 *
 * @returns {JSX.Element} The link that goes to the market page, or if in test, the  div that emulates triggering a
 * random event in our event state store.
 */
export const LinkOrAnimationTrigger = ({
  emojis,
  marketID,
  ...props
}: { emojis: SymbolEmojiData[]; marketID: number } & PropsWithChildren) => {
  const generateEvent = useGenerateEvent({ marketID, emojis, stateOnly: true });

  return (
    <>
      {VERCEL ||
      process.env.NODE_ENV === "production" ||
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
