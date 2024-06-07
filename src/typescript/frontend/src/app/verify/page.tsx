import VerifyPage from "components/pages/verify/VerifyPage";
import {
  COOKIE_FOR_PUBKEY,
  COOKIE_FOR_SIGNATURE,
  COOKIE_FOR_ACCOUNT_SCHEME,
  COOKIE_FOR_ACCOUNT_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";

const Verify = async () => {
  const pubkey = cookies().get(COOKIE_FOR_PUBKEY)?.value;
  const signature = cookies().get(COOKIE_FOR_SIGNATURE)?.value;
  const accountScheme = cookies().get(COOKIE_FOR_ACCOUNT_SCHEME)?.value;
  const accountAddress = cookies().get(COOKIE_FOR_ACCOUNT_ADDRESS)?.value;

  let authenticated = false;
  if (!pubkey || !signature || !accountScheme || !accountAddress) {
    return <VerifyPage />;
  } else {
    authenticated = await authenticate({
      pubkey,
      signature,
      scheme: accountScheme,
      address: accountAddress,
    });

    if (authenticated) {
      redirect(ROUTES.home);
    }
  }

  return <VerifyPage />;
};

export default Verify;
