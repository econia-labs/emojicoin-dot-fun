"use client";

// cspell:word martianwallet
// cspell:word pontem
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
  WebSocketEventsProvider,
  UserSettingsProvider,
} from "./state-store-context/StateStoreContextProviders";
import { enableMapSet } from "immer";
import { ConnectToWebSockets } from "./ConnectToWebSockets";
import { APTOS_NETWORK } from "lib/env";
import { WalletModalContextProvider } from "./wallet-context/WalletModalContext";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { EmojiPickerProvider } from "./emoji-picker-context/EmojiPickerContextProvider";
import { isMobile, isTablet } from "react-device-detect";

enableMapSet();

const ThemedApp: React.FC<{ children: React.ReactNode; geoblocked: boolean }> = ({
  children,
  geoblocked,
}) => {
  const { theme } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();

  const isMobileMenuOpen = isOpen && !isDesktop;

  const wallets = useMemo(
    () => [
      new PontemWallet(),
      new RiseWallet(),
      new MartianWallet(),
      // new AptosConnectWalletPlugin({ network: APTOS_NETWORK }),
    ],
    []
  );
  // TODO: Make fetch queries here and pass the data to the event store..?
  // It's possible we can also pass a promise down from the server components
  // to the clients and then add those to the store as they stream in.

  const queryClient = new QueryClient();

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <WebSocketEventsProvider>
          <UserSettingsProvider>
            <AptosWalletAdapterProvider
              plugins={wallets}
              autoConnect={true}
              optInWallets={["Petra"]}
              dappConfig={{ network: APTOS_NETWORK }}
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
                        <Header
                          isOpen={isMobileMenuOpen}
                          setIsOpen={setIsOpen}
                          geoblocked={geoblocked}
                        />
                        {children}
                        <Footer />
                      </ContentWrapper>
                    </Suspense>
                  </EmojiPickerProvider>
                </AptosContextProvider>
              </WalletModalContextProvider>
            </AptosWalletAdapterProvider>
          </UserSettingsProvider>
        </WebSocketEventsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const Providers: React.FC<{ children: React.ReactNode; geoblocked: boolean }> = ({
  children,
  geoblocked,
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
        <ThemedApp geoblocked={geoblocked}>{children}</ThemedApp>
      </ThemeContextProvider>
    )
  );
};

export default Providers;
