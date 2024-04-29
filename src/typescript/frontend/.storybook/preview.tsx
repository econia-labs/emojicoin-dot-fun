import React from "react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { StyleSheetManager, ThemeProvider } from "styled-components";

import { GlobalStyle, StyledToastContainer } from "../src/styles";
import { LanguageContextProvider, ThemeContextProvider, useThemeContext } from "../src/context";
import { Loader, Modal } from "../src/components";
import store from "../src/store/store";
import { shouldForwardProp } from "../src/utils";

import "react-toastify/dist/ReactToastify.css";

const ThemedApp = ({ children }) => {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider theme={theme}>
      <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        <LanguageContextProvider fallback={<Loader />}>
          <Provider store={store}>
            <GlobalStyle />
            <Modal />
            <StyledToastContainer />
            {children}
          </Provider>
        </LanguageContextProvider>
      </StyleSheetManager>
    </ThemeProvider>
  );
};

const globalDecorator = (StoryFn: React.FC) => {
  return (
    <>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeContextProvider>
            <ThemedApp>
              <StoryFn />
            </ThemedApp>
          </ThemeContextProvider>
        </BrowserRouter>
      </HelmetProvider>

      <link
        rel="preload"
        href="%PUBLIC_URL%/fonts/Pixelar-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      <link href="/css/fonts.css" rel="stylesheet" />
    </>
  );
};

export const decorators = [globalDecorator];
