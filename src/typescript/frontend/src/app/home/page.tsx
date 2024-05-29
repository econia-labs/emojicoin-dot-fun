import Home from "components/pages/home";
import { fetchTopMarkets } from "lib/queries/initial/markets";

export default async function HomePage() {
  const data = await fetchTopMarkets();

  return <Home data={data} />;
}
