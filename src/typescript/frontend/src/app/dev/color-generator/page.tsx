import { EmojiColorGenerator } from "lib/utils/emojiColors/emoji-color-generator";
import { redirect } from "next/navigation";

export default function EmojiColorPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/404");
  }
  return <EmojiColorGenerator />;
}
