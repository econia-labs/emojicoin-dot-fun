import { AptPriceContextProvider } from "context/AptPrice";

import HomePageComponent from "./HomePage";
import { fetchHomePageData } from "./queries";

export const revalidate = 10;
export const dynamic = "force-static";

export default async function HomePage() {
  const result = await fetchHomePageData({ sort: "bump", page: "1" });

  if (result.notFound) {
    throw new Error("Default home page data not found somehow.");
  }

  const { data } = result;

  return (
    <AptPriceContextProvider aptPrice={data.aptPrice}>
      <HomePageComponent {...data} />
    </AptPriceContextProvider>
  );
}
