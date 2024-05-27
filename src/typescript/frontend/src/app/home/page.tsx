import Home from "components/pages/home";
import getCachedMarketData from "lib/queries/initial/markets";

export default async function HomePage() {
  const markets = await getCachedMarketData();

  return <Home markets={markets} />;
}
