import ClientHomePage from "components/pages/home/ClientHomePage";
import fetchMarketData from "lib/queries/initial/market-data";

export default async function HomePage() {
  const data = await fetchMarketData();

  return <ClientHomePage data={data} />;
}
