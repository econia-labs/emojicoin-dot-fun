import { type Metadata, type Viewport } from "next";
import { getDefaultMetadata } from "configs/meta";
import Providers from "context/providers";
import StyledComponentsRegistry from "lib/registry";
import { SubscribeToMarketRegistrations } from "@store/server-to-client/SubscribeToMarketRegistrations";
import "react-toastify/dist/ReactToastify.css";
import {
  formaDJRDisplayMedium,
  formaDJRDisplayRegular,
  formaDJRMicro,
  pixelar,
} from "styles/fonts";
import "../app/global.css";
import DisplayDebugData from "@store/server-to-client/FetchFromServer";
import { isUserGeoblocked } from "utils/geolocation";
import { headers } from "next/headers";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

const fonts = [pixelar, formaDJRMicro, formaDJRDisplayMedium, formaDJRDisplayRegular];
const fontsClassName = fonts.map((font) => font.variable).join(" ");

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return (
    <html>
      <body className={fontsClassName}>
        <StyledComponentsRegistry>
          <Providers geoblocked={geoblocked}>
            <DisplayDebugData />
            <SubscribeToMarketRegistrations />
            {children}
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
