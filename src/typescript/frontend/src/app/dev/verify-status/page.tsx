import { headers } from "next/headers";

import VerifyStatusPage from "@/components/pages/verify-status/VerifyStatusPage";

const Verify = async () => {
  const country = headers().get("x-vercel-ip-country");
  const region = headers().get("x-vercel-ip-country-region");
  return <VerifyStatusPage country={country} region={region} />;
};

export default Verify;
