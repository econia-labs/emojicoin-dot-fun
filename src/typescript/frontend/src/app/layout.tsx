import { type Metadata, type Viewport } from "next";
import { getDefaultMetadata } from "configs/meta";
import Providers from "context/providers";
import StyledComponentsRegistry from "lib/registry";
import "react-toastify/dist/ReactToastify.css";
import {
  formaDJRDisplayMedium,
  formaDJRDisplayRegular,
  formaDJRMicro,
  notoColorEmoji,
  pixelar,
} from "styles/fonts";
import "../app/global.css";
import DisplayDebugData from "@/store/server-to-client/FetchFromServer";
import { headers } from "next/headers";
import { getBooleanUserAgentSelectors } from "lib/utils/user-agent-selectors";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

const fonts = [pixelar, formaDJRMicro, formaDJRDisplayMedium, formaDJRDisplayRegular];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userAgent = headers().get("user-agent") || "";
  const { isIOS, isMacOs } = getBooleanUserAgentSelectors(userAgent);
  // Only use the Noto Color Emoji font if the user is not on a recognized iOS or MacOS device.
  if (!isIOS && !isMacOs) {
    fonts.push(notoColorEmoji);
  }
  const fontsClassName = fonts.map((font) => font.variable).join(" ");

  return (
    <html>
      <body className={fontsClassName}>
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
