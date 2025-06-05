"use client";

// cspell:word martianwallet
// cspell:word pontem
// cspell:word okwallet
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { init } from "emoji-mart";
import { enableMapSet } from "immer";
import { APTOS_NETWORK } from "lib/env";
import React, { Suspense, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "styles";
import StyledToaster from "styles/StyledToaster";
import darkTheme from "theme/dark";
import { completePickerData } from "utils/picker-data/complete-picker-data";

import Footer from "@/components/footer";
import { GeoblockedBanner } from "@/components/geoblocking";
import Header from "@/components/header";
import { HeaderSpacer } from "@/components/header-spacer";
import Loader from "@/components/loader";
import type { EmojiMartData } from "@/components/pages/emoji-picker/types";
import { useTailwindBreakpoints } from "@/hooks/use-tailwind-breakpoints";
import { clientKeys } from "@/sdk/const";

import { ConnectToWebSockets } from "./ConnectToWebSockets";
import ContentWrapper from "./ContentWrapper";
import { EmojiPickerProvider } from "./emoji-picker-context/EmojiPickerContextProvider";
import { UserSettingsProvider } from "./event-store-context/StateStoreContextProviders";
import { AptosContextProvider } from "./wallet-context/AptosContextProvider";
import { WalletModalContextProvider } from "./wallet-context/WalletModalContext";

enableMapSet();

const queryClient = new QueryClient();

const Providers = ({ userAgent, children }: { userAgent: string } & React.PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const { lg } = useTailwindBreakpoints();
  const isMobileMenuOpen = isOpen && !lg;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    /**
     * Initialize the picker data from the CDN- then augment it with the missing emoji data with @see completePickerData.
     * This must be in a client component lest the nextjs server cache the entirety of the CDN response.
     */
    fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then((res) =>
      res
        .json()
        .then((data) => data as EmojiMartData)
        .then(completePickerData)
        .then((data) => init({ set: "native", data }))
    );
  }, []);

  return (
    isMounted && (
      <ThemeProvider theme={darkTheme}>
        <QueryClientProvider client={queryClient}>
          <UserSettingsProvider userAgent={userAgent}>
            <AptosWalletAdapterProvider
              autoConnect={true}
              dappConfig={{
                aptosApiKeys: clientKeys,
                network: APTOS_NETWORK,
              }}
            >
              <WalletModalContextProvider>
                <AptosContextProvider>
                  <EmojiPickerProvider
                    initialState={{
                      nativePicker: isMobile || isTablet,
                    }}
                  >
                    <GlobalStyle />
                    <ConnectToWebSockets />
                    <Suspense fallback={<Loader />}>
                      <StyledToaster />
                      <ContentWrapper>
                        <Header isOpen={isMobileMenuOpen} setIsOpen={setIsOpen} />
                        <HeaderSpacer />
                        <GeoblockedBanner />
                        {children}
                        <Footer />
                      </ContentWrapper>
                    </Suspense>
                  </EmojiPickerProvider>
                </AptosContextProvider>
              </WalletModalContextProvider>
            </AptosWalletAdapterProvider>
          </UserSettingsProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  );
};

export default Providers;
