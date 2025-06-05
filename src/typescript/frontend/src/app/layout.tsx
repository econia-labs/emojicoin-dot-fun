import "react-toastify/dist/ReactToastify.css";
import "../app/global.css";
import "@react95/core/themes/win95.css";

import { getDefaultMetadata } from "configs/meta";
import Providers from "context/providers";
import DisplayDebugData from "lib/local-development/DisplayDebugData";
import StyledComponentsRegistry from "lib/registry";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { fontsStyle, notoColorEmoji } from "styles/fonts";

import { BackgroundEmojis } from "@/components/misc/background-emojis/BackgroundEmojis";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userAgent = headers().get("user-agent") || "";
  return (
    <html>
      <body>
        {/* This is used to avoid React escaping the quotes in `fontsStyle`. */}
        <style dangerouslySetInnerHTML={{ __html: fontsStyle }} />
        <StyledComponentsRegistry>
          <Providers userAgent={userAgent}>
            <BackgroundEmojis />
            <DisplayDebugData />
            {children}
          </Providers>
        </StyledComponentsRegistry>
        {/* Load the font regardless of the user agent string so that there's no flashing. */}
        <div className={notoColorEmoji.className + " absolute top-0 left-0 hidden"}>{"👽"}</div>
      </body>
    </html>
  );
}
