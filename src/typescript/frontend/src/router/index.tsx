import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { MainOutlet, NotFoundPage, ErrorBoundaryFallback } from "components";
import { HomePage, ConnectWalletPage, EmojicoinPage, LaunchEmojicoinPage, PoolsPage } from "pages";
import App from "App";

import { ROUTES } from "./routes";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={ROUTES.root} Component={App} ErrorBoundary={ErrorBoundaryFallback}>
      <Route index element={<Navigate to={ROUTES.home} />} />

      <Route path={ROUTES.root} element={<MainOutlet />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.connectWallet} element={<ConnectWalletPage />} />
        <Route path={ROUTES.emojicoin} element={<EmojicoinPage />} />
        <Route path={ROUTES.launchEmojicoin} element={<LaunchEmojicoinPage />} />
        <Route path={ROUTES.pools} element={<PoolsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);
