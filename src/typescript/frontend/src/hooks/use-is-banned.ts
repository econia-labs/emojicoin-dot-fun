import { useState } from "react";
import { isBanned } from "utils/geolocation";

const useIsBanned = () => {
  const [banned, setBanned] = useState(true);

  isBanned().then(res => setBanned(res));

  return banned;
};

export default useIsBanned;
