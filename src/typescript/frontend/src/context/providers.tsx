"use client";

// cspell:word martianwallet
// cspell:word pontem
// cspell:word okwallet
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { getAptosApiKey } from "@sdk/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Footer from "components/footer";
import { GeoblockedBanner } from "components/geoblocking";
import Header from "components/header";
import { HeaderSpacer } from "components/header-spacer";
import Loader from "components/loader";
import type { EmojiMartData } from "components/pages/emoji-picker/types";
import { init } from "emoji-mart";
import useMatchBreakpoints from "hooks/use-match-breakpoints/use-match-breakpoints";
import { enableMapSet } from "immer";
import { APTOS_NETWORK } from "lib/env";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "styles";
import StyledToaster from "styles/StyledToaster";
import { completePickerData } from "utils/picker-data/complete-picker-data";

import { ConnectToWebSockets } from "./ConnectToWebSockets";
import ContentWrapper from "./ContentWrapper";
import { EmojiPickerProvider } from "./emoji-picker-context/EmojiPickerContextProvider";
import {
  EventStoreProvider,
  UserSettingsProvider,
} from "./event-store-context/StateStoreContextProviders";
import ThemeContextProvider, { useThemeContext } from "./theme-context";
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

const ThemedApp: React.FC<{ userAgent: string; children: React.ReactNode }> = ({
  userAgent,
  children,
}) => {
  const { theme } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();
  const isMobileMenuOpen = isOpen && !isDesktop;

  const wallets = useMemo(
    () => [new PontemWallet(), new RiseWallet(), new MartianWallet(), new OKXWallet()],
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <EventStoreProvider>
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
        </EventStoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const Providers: React.FC<{ userAgent: string; children: React.ReactNode }> = ({
  userAgent,
  children,
}) => {
  const [p, setP] = useState(false);

  // Hack for now because I'm unsure how to get rid of the warning.
  // Not sure if this is even the wrong way to do it, actually.
  useEffect(() => {
    setP(true);
  }, []);

  return (
    p && (
      <ThemeContextProvider>
        <ThemedApp userAgent={userAgent}>{children}</ThemedApp>
      </ThemeContextProvider>
    )
  );
};

export default Providers;
