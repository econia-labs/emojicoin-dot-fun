import { generateHomePageStaticParams } from "app/home/static-params";
import { AptPriceContextProvider } from "context/AptPrice";
import type { HomePageParams } from "lib/routes/home-page-params";

import NotFoundComponent from "@/components/pages/not-found";

import HomePageComponent from "../../HomePage";
import { fetchHomePageData } from "../../queries";

export const revalidate = 10;
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams() {
  return await generateHomePageStaticParams();
}

export default async function HomePageWithSlugs({ params }: HomePageParams) {
  const result = await fetchHomePageData(params);

  if (result.notFound) {
    return <NotFoundComponent />;
  }

  const { data } = result;

  return (
    <AptPriceContextProvider aptPrice={data.aptPrice}>
      <HomePageComponent {...data} />
    </AptPriceContextProvider>
  );
}
