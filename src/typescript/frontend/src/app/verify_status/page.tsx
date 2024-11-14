import VerifyStatusPage from "components/pages/verify_status/VerifyStatusPage";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";

export const dynamic = "force-dynamic";

const Verify = async () => {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  return <VerifyStatusPage geoblocked={geoblocked} />;
};

export default Verify;
