import { render, screen } from "@testing-library/react";
import { type HomePageParams } from "../../src/lib/routes/home-page-params";
import { DefaultHomePageSearchParams } from "../../src/lib/queries/sorting/query-params";
import Home from "../../src/app/home/page";
it("App Router: Creates the home page server component", async () => {
  const params: HomePageParams = {
    params: {},
    searchParams: DefaultHomePageSearchParams,
  };

  const { container } = render(await Home(params));
  container.querySelector("div");
  console.warn(container);
  // screen.getByRole
});
