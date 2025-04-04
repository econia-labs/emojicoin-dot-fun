import { EmojiColorGenerator } from "lib/utils/emojiColors/emoji-color-generator";
import { redirect } from "next/navigation";

import { VERCEL_TARGET_ENV } from "@/sdk/const";

export default function EmojiColorPage() {
  if (VERCEL_TARGET_ENV === "production" || VERCEL_TARGET_ENV === "release-preview") {
    redirect("/404");
  }
  return <EmojiColorGenerator />;
}
