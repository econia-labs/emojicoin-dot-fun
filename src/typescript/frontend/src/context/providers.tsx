"use client";

// cspell:word martianwallet
// cspell:word pontem
// cspell:word okwallet
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { init } from "emoji-mart";
import { enableMapSet } from "immer";
import { APTOS_NETWORK } from "lib/env";
import React, { Suspense, useEffect, useMemo, useState } from "react";
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
import useMatchBreakpoints from "@/hooks/use-match-breakpoints/use-match-breakpoints";
import { getAptosApiKey } from "@/sdk/const";

import { ConnectToWebSockets } from "./ConnectToWebSockets";
import ContentWrapper from "./ContentWrapper";
import { EmojiPickerProvider } from "./emoji-picker-context/EmojiPickerContextProvider";
import { UserSettingsProvider } from "./event-store-context/StateStoreContextProviders";
import { AptosContextProvider } from "./wallet-context/AptosContextProvider";
import { WalletModalContextProvider } from "./wallet-context/WalletModalContext";

/**
 * Initialize the picker data from the CDN- then augment it with the missing emoji data with @see completePickerData.
 */
fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then((res) =>
  res
    .json()
    .then((data) => data as EmojiMartData)
    .then(completePickerData)
    .then((data) => init({ set: "native", data }))
);

enableMapSet();

const queryClient = new QueryClient();

const Providers = ({ userAgent, children }: { userAgent: string } & React.PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();
  const isMobileMenuOpen = isOpen && !isDesktop;
  const [isMounted, setIsMounted] = useState(false);

  const wallets = useMemo(
    () => [new PontemWallet(), new RiseWallet(), new MartianWallet(), new OKXWallet()],
    []
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    isMounted && (
      <ThemeProvider theme={darkTheme}>
        <QueryClientProvider client={queryClient}>
          <UserSettingsProvider userAgent={userAgent}>
            <AptosWalletAdapterProvider
              plugins={wallets}
              autoConnect={true}
              dappConfig={{
                aptosApiKey: getAptosApiKey(),
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
