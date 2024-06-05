import ClientHomePage from "components/pages/home/ClientHomePage";
import fetchMarketData from "lib/queries/initial/market-data";

export const revalidate = process.env.SHORT_REVALIDATE === "true" ? 10 : 3600;
export const dynamic = "auto";

export default async function HomePage() {
  const data = await fetchMarketData();

  return <ClientHomePage data={data} />;
}
