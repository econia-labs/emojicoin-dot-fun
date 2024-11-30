import { type Metadata, type Viewport } from "next";
import { getDefaultMetadata } from "configs/meta";
import Providers from "context/providers";
import StyledComponentsRegistry from "lib/registry";
import "react-toastify/dist/ReactToastify.css";
import { fontsStyle } from "styles/fonts";
import { notoColorEmoji } from "styles/fonts";
import { headers } from "next/headers";
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";
import { useMemo } from "react";
import DisplayDebugData from "@/store/server-to-client/FetchFromServer";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userAgent = headers().get("user-agent") || "";
  const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
  // Only use the Noto Color Emoji font if the user is not on a recognized iOS or MacOS device.
  const maybeNotoFontClassName = useMemo(
    () => (isIOS || isMacOs ? "" : notoColorEmoji.className),
    [isIOS, isMacOs]
  );

  return (
    <html>
      <body className={maybeNotoFontClassName}>
        {/* This is used to avoid React escaping the quotes in `fontsStyle`. */}
        <style dangerouslySetInnerHTML={{ __html: fontsStyle }} />
        <StyledComponentsRegistry>
          <Providers>
            <DisplayDebugData />
            {children}
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
