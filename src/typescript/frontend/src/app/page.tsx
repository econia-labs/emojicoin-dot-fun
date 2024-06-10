import { REVALIDATION_TIME } from "lib/server-env";
import Home from "./home/page";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <Home params={{}}> </Home>;
}
