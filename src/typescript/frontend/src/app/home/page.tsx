import Home from "components/pages/home";
import getInitialMarketData from "lib/queries/initial/markets";

export default async function HomePage() {
  const markets = await getInitialMarketData();

  return <Home markets={markets} />;
}
