import React from "react";

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "router";
// TODO do we need toasters?
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
