import VerifyPage from "components/pages/verify/VerifyPage";
import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

export const dynamic = "force-dynamic";

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
