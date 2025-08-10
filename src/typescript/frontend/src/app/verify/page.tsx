import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import VerifyPage from "components/pages/verify/VerifyPage";
import generateMetadataHelper from "lib/utils/generate-metadata-helper";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

export const metadata = generateMetadataHelper({
  title: "verify",
  description: "verify so we know who to blame when the chart dips",
});

const Verify = async () => {
  const hashed = cookies().get(COOKIE_FOR_HASHED_ADDRESS)?.value;
  const address = cookies().get(COOKIE_FOR_ACCOUNT_ADDRESS)?.value;

  let authenticated = false;
  if (!hashed || !address) {
    return <VerifyPage />;
  } else {
    authenticated = await authenticate({
      address,
      hashed,
    });

    if (authenticated) {
      redirect(ROUTES.home);
    }
  }

  return <VerifyPage />;
};

export default Verify;
