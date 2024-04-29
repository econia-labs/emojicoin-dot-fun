import React, { Suspense } from "react";
import { Provider } from "react-redux";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import { HelmetProvider } from "react-helmet-async";
import { Outlet, ScrollRestoration } from "react-router-dom";
// Styles
import { GlobalStyle, StyledToastContainer } from "styles";
// Context
import { LanguageContextProvider, ThemeContextProvider, useThemeContext } from "context";
// Store
import store from "store/store";
// Components
import { ErrorBoundary, Loader, Modal, ErrorBoundaryFallback } from "components";

import { shouldForwardProp } from "utils";

const ThemedApp: React.FC = () => {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />

      <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        <Suspense fallback={<Loader />}>
          <LanguageContextProvider fallback={<Loader />}>
            <Provider store={store}>
              <Modal />
              <StyledToastContainer />
              <Outlet />
            </Provider>
          </LanguageContextProvider>
        </Suspense>
      </StyleSheetManager>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackComponent={ErrorBoundaryFallback}>
      <HelmetProvider>
        <ThemeContextProvider>
          <ThemedApp />
        </ThemeContextProvider>
      </HelmetProvider>

      <ScrollRestoration />
    </ErrorBoundary>
  );
};

export default App;
