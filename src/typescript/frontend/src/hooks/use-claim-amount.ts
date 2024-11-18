import { ONE_APT } from "@sdk/const";
import { ClaimAmount } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useQuery } from "@tanstack/react-query";
import { MS_IN_ONE_DAY } from "components/charts/const";
import { useAptos } from "context/wallet-context/AptosContextProvider";

const useClaimAmount = () => {
  const { aptos } = useAptos();
  const { data } = useQuery({
    queryKey: ["claim-amount"],
    queryFn: () => ClaimAmount.view({ aptos }),
    staleTime: MS_IN_ONE_DAY,
    initialData: ONE_APT,
  });

  return data;
};

export default useClaimAmount;
