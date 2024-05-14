"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { GlobalStyle, StyledToastContainer } from "styles";
import ThemeContextProvider, { useThemeContext } from "./theme-context";
import LanguageContextProvider from "./language-context";
import store from "store/store";
import Loader from "components/loader";
import Modal from "components/modal";
import { Column } from "@/containers";
import Header from "components/header";
import Footer from "components/footer";
import useMatchBreakpoints from "hooks/use-match-breakpoints/use-match-breakpoints";

const ThemedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeContext();

  const [isOpen, setIsOpen] = useState(false);
  const { isDesktop } = useMatchBreakpoints();

  const isMobileMenuOpen = isOpen && !isDesktop;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Suspense fallback={<Loader />}>
        <LanguageContextProvider fallback={<Loader />}>
          <Provider store={store}>
            <Modal />
            <StyledToastContainer />
            <Column maxWidth="100vw" px="0px" height="100vh" overflowX="hidden">
              <Header isOpen={isMobileMenuOpen} setIsOpen={setIsOpen} />
              {children}
              <Footer />
            </Column>
          </Provider>
        </LanguageContextProvider>
      </Suspense>
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
