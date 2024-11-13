import { useQuery } from "@tanstack/react-query";
import { MS_IN_ONE_DAY } from "components/charts/const";
import { isUserGeoblocked } from "utils/geolocation";

const SEVEN_DAYS_MS = 7 * MS_IN_ONE_DAY;

const useIsUserGeoblocked = () => {
  const { data } = useQuery({
    queryKey: ["geoblocked"],
    queryFn: () => isUserGeoblocked(),
    staleTime: SEVEN_DAYS_MS,
    placeholderData: (prev) => prev,
  });

  // Assume the user is geoblocked if the response hasn't completed yet.
  return data ?? true;
};

export default useIsUserGeoblocked;
