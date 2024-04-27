import React from "react";
import { Outlet } from "react-router-dom";

import { Page, Header, Footer } from "components";

const MainOutlet: React.FC = () => {
  return (
    <Page maxWidth="100%" px="0px">
      <Header />
      <Outlet />
      <Footer />
    </Page>
  );
};

export default MainOutlet;
