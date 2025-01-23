import { type Metadata, type Viewport } from "next";
import { getDefaultMetadata } from "configs/meta";
import Providers from "context/providers";
import StyledComponentsRegistry from "lib/registry";
import "react-toastify/dist/ReactToastify.css";
import "../app/global.css";
import DisplayDebugData from "@/store/server-to-client/FetchFromServer";
import { fontsStyle } from "styles/fonts";
import { headers } from "next/headers";
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userAgent = headers().get("user-agent") || "";
  console.log("user agent string:", userAgent);
  Object.entries(getBooleanUserAgentSelectors(userAgent)).map(([key, value]) => {
    console.log(key, value);
  });
  return (
    <html>
      <body>
        {/* This is used to avoid React escaping the quotes in `fontsStyle`. */}
        <style dangerouslySetInnerHTML={{ __html: fontsStyle }} />
        <StyledComponentsRegistry>
          <Providers userAgent={userAgent}>
            <DisplayDebugData />
            {children}
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
