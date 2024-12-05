"use client";

// cspell:word bitget
// cspell:word martianwallet
// cspell:word pontem
// cspell:word okwallet
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "styles";
import ThemeContextProvider, { useThemeContext } from "./theme-context";
import Loader from "components/loader";
import Header from "components/header";
import Footer from "components/footer";
import useMatchBreakpoints from "hooks/use-match-breakpoints/use-match-breakpoints";
import ContentWrapper from "./ContentWrapper";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AptosContextProvider } from "./wallet-context/AptosContextProvider";
import StyledToaster from "styles/StyledToaster";
import {
  EventStoreProvider,
  UserSettingsProvider,
} from "./event-store-context/StateStoreContextProviders";
import { enableMapSet } from "immer";
import { ConnectToWebSockets } from "./ConnectToWebSockets";
import { APTOS_NETWORK } from "lib/env";
import { WalletModalContextProvider } from "./wallet-context/WalletModalContext";
import { BitgetWallet } from "@bitget-wallet/aptos-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { EmojiPickerProvider } from "./emoji-picker-context/EmojiPickerContextProvider";
import { isMobile, isTablet } from "react-device-detect";
import { getAptosApiKey } from "@sdk/const";
import type { EmojiMartData } from "components/pages/emoji-picker/types";
import { init } from "emoji-mart";
import { HeaderSpacer } from "components/header-spacer";
import { GeoblockedBanner } from "components/geoblocking";

enableMapSet();

const queryClient = new QueryClient();

// This is 400KB of lots of repeated data, we can use a smaller version of this if necessary later.
// TBH, we should probably just fork the library.
const data = fetch("https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/15/native.json").then(
  (res) =>
    res.json().then((data) => {
      return data as EmojiMartData;
    })
);

const ThemedApp = ({ children }) => {
  const { theme } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();

  const isMobileMenuOpen = isOpen && !isDesktop;

  const wallets = useMemo(
    () => [
      new BitgetWallet(),
      new PontemWallet(),
      new RiseWallet(),
      new MartianWallet(),
      new OKXWallet(),
    ],
    []
  );

  // Load the data from the emoji picker library and then extract the valid chat emojis from it.
  // This is why it's not necessary to build/import a `chat-emojis.json` set, even though there is `symbol-emojis.json`.
  // NOTE: We don't verify that the length of this set is equal to the number of valid chat emojis in the Move contract.
  useEffect(() => {
    data.then((d) => {
      init({ set: "native", data: d });
    });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <EventStoreProvider>
          <UserSettingsProvider>
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

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [p, setP] = useState(false);

  // Hack for now because I'm unsure how to get rid of the warning.
  // Not sure if this is even the wrong way to do it, actually.
  useEffect(() => {
    setP(true);
  }, []);

  return (
    p && (
      <ThemeContextProvider>
        <ThemedApp>{children}</ThemedApp>
      </ThemeContextProvider>
    )
  );
};

export default Providers;
