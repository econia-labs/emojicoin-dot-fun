"use client";

import { emoji } from "utils";
import { Emoji } from "utils/emoji";

export default function UserNotFound() {
  return (
    <div className="flex h-full flex-col justify-center align-middle">
      <div className="m-auto flex flex-row gap-2 !font-forma-bold text-[64px] leading-[64px] text-warning">
        {"We couldn't find that user."}
        <Emoji emojis={emoji("sad but relieved face")} />
      </div>
    </div>
  );
}
