"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { GlobalStyle, StyledToastContainer } from "styles";
import ThemeContextProvider, { useThemeContext } from "./theme-context";
import store from "store/store";
import Loader from "components/loader";
import Header from "components/header";
import Footer from "components/footer";
import useMatchBreakpoints from "hooks/use-match-breakpoints/use-match-breakpoints";
import { StyledContentWrapper } from "./styled";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { ConnectWalletContextProvider } from "./wallet-context/ConnectWalletContext";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";

const ThemedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeContext();

  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();

  const isMobileMenuOpen = isOpen && !isDesktop;

  const wallets = useMemo(() => [new PontemWallet(), new RiseWallet(), new MartianWallet()], []);

  return (
    <ThemeProvider theme={theme}>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect>
        <ConnectWalletContextProvider>
          <GlobalStyle />
          <Suspense fallback={<Loader />}>
            <Provider store={store}>
              <StyledToastContainer />
              <StyledContentWrapper>
                <Header isOpen={isMobileMenuOpen} setIsOpen={setIsOpen} />
                {children}
                <Footer />
              </StyledContentWrapper>
            </Provider>
          </Suspense>
        </ConnectWalletContextProvider>
      </AptosWalletAdapterProvider>
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
