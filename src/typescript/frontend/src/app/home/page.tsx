import ClientHomePage from "components/pages/home/ClientHomePage";
import { REVALIDATION_TIME } from "lib/server-env";
import fetchMarketData from "lib/queries/initial/market-data";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "auto";

export default async function HomePage() {
  const data = await fetchMarketData();

  return <ClientHomePage data={data} />;
}
