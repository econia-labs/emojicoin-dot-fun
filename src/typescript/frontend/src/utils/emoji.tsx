import { type AnyEmojiData, getEmojisInString } from "@sdk/index";
import { useEmojiFontConfig } from "lib/hooks/use-emoji-font-family";
import { useMemo, type DetailedHTMLProps, type HTMLAttributes } from "react";

/**
 * Displays emoji as a simple span element containing text representing one or more emojis.
 *
 * It uses the emoji font determined by @see {@link useEmojiFontConfig}.
 */
export const Emoji = ({
  emojis,
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  emojis: AnyEmojiData[] | string;
}) => {
  const { emojiFontClassName } = useEmojiFontConfig();

  const data = useMemo(
    () =>
      typeof emojis === "string"
        ? getEmojisInString(emojis).join("")
        : emojis.map((e) => e.emoji).join(""),
    [emojis]
  );

  return (
    // Wrap this in div so that any font families from tailwind utility classes don't clash with the emoji font class
    // name. This means it's not necessary to manually change each usage of font utility classes in the codebase, and
    // instead just let the font size / line height cascade downwards but override the font family with the emoji font.
    <div className={props.className}>
      <span {...props} className={emojiFontClassName} style={{ fontVariantEmoji: "emoji" }}>
        {data}
      </span>
    </div>
  );
};

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      "em-emoji": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: string;
        native?: string;
        key?: string;
        set?: string;
      };
    }
  }
}

/**
 * Renders an emoji as an image using a CDN from the emoji picker library.
 * This facilitates specifying the emoji set (native, Apple, Windows, etc) and size, but will take longer to load in
 * multiple ways, since it's loading an image instead of rendering emojis as text.
 */
export const EmojiAsImage = ({
  emojis,
  set = undefined,
  size = "1em",
  ...props
}: Omit<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "children"> & {
  emojis: AnyEmojiData[] | string;
  set?: string;
  size?: string;
}) => {
  let data: React.ReactNode[] = [];
  if (typeof emojis === "string") {
    const emojisInString = getEmojisInString(emojis);
    data = emojisInString.map((e, i) => (
      <em-emoji key={`${emojisInString[i]}-${i}`} size={size} native={e} set={set}></em-emoji>
    ));
  } else {
    data = emojis.map((e, i) => (
      <em-emoji key={`${emojis[i].emoji}-${i}`} size={size} native={e.emoji}></em-emoji>
    ));
  }
  return <span {...props}>{data}</span>;
};
