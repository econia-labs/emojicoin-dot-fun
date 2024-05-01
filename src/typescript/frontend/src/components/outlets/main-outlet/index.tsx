import React from "react";
import { Outlet } from "react-router-dom";

import { Header, Footer, Column } from "components";

const MainOutlet: React.FC = () => {
  return (
    <Column maxWidth="100%" px="0px" height="100vh">
      <Header />
      <Outlet />
      <Footer />
    </Column>
  );
};

export default MainOutlet;
