import { cn } from "lib/utils/class-name";
import { useEffect, useState } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

export const BrowserNotSupported = () => {
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowErrorMessage(true), 3500);
    return () => clearTimeout(timeout);
  });

  return (
    <div
      className={cn(
        "absolute left-0 top-0 flex h-full w-full animate-fadeIn items-center justify-center text-center",
        "font-roboto-mono text-lg font-light leading-6 text-neutral-500 opacity-0 delay-[2000]"
      )}
    >
      <div>
        {showErrorMessage ? (
          <>
            <div>
              <span>{"The browser you're using isn't supported. "}</span>
              <Emoji emojis={emoji("pensive face")} />
            </div>
            <div>
              <span>{" Please try viewing in another browser."}</span>
            </div>
          </>
        ) : (
          "Loading..."
        )}
      </div>
    </div>
  );
};
