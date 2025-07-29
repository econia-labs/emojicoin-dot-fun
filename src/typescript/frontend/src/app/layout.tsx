import "react-toastify/dist/ReactToastify.css";
import "../app/global.css";
import "@react95/core/themes/win95.css";

import { getDefaultMetadata } from "configs/meta";
import { AptPriceContextProvider } from "context/AptPrice";
import LayoutGlobalState from "context/LayoutGlobalState";
import Providers from "context/providers";
import DisplayDebugData from "lib/local-development/DisplayDebugData";
import { maybeCacheBuildFetch } from "lib/nextjs/build-cache";
import { fetchCachedArenaInfo } from "lib/queries/arena-info";
import { fetchAptPrice, fetchCachedAptPrice } from "lib/queries/get-apt-price";
import StyledComponentsRegistry from "lib/registry";
import type { Metadata, Viewport } from "next";
import { fontsStyle, notoColorEmoji } from "styles/fonts";

import { BackgroundEmojis } from "@/components/misc/background-emojis/BackgroundEmojis";
import { toArenaInfoModel } from "@/sdk/index";

export const metadata: Metadata = getDefaultMetadata();
export const viewport: Viewport = {
  themeColor: "#000000",
};

// get apt price here
// get arena/melee info here?
//

export const revalidate = 10;
// Use `error` instead of `force-static` here to ensure all pages are statically rendered.
// export const dynamic = "error";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [aptPrice, arenaInfo] = await Promise.all([
    fetchCachedAptPrice().then((res) => {
      // console.log("FETCHING CACHED APT PRICE IN LAYOUT.TSX");
      return res;
    }),
    fetchCachedArenaInfo().then((res) => (res ? toArenaInfoModel(res) : null)),
  ]);

  return (
    <html>
      <body>
        {/* This is used to avoid React escaping the quotes in `fontsStyle`. */}
        <style dangerouslySetInnerHTML={{ __html: fontsStyle }} />
        <AptPriceContextProvider aptPrice={aptPrice}>
          <StyledComponentsRegistry>
            <Providers>
              <BackgroundEmojis />
              <DisplayDebugData />
              <LayoutGlobalState arenaInfo={arenaInfo} />
              {children}
            </Providers>
          </StyledComponentsRegistry>
        </AptPriceContextProvider>
        {/* Load the font regardless of the user agent string so that there's no flashing. */}
        <div className={notoColorEmoji.className + " absolute top-0 left-0 hidden"}>{"👽"}</div>
      </body>
    </html>
  );
}
