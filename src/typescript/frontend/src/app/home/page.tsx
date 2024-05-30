import ClientHomePage from "components/pages/home/ClientHomePage";
import { fetchTopMarkets } from "lib/queries/initial/markets";

export default async function HomePage() {
  const data = await fetchTopMarkets();

  return <ClientHomePage data={data} />;
}
