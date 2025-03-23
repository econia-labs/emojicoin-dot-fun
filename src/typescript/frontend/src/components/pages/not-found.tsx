"use client";

import { emoji } from "utils";
import { Emoji } from "utils/emoji";

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center align-middle h-full">
      <div className="text-warning flex flex-row text-[64px] leading-[64px] !font-forma-bold m-auto gap-2">
        {"We couldn't find that page."}
        <Emoji emojis={emoji("confused face")} />
      </div>
    </div>
  );
}
