import React from "react";
import Image from "next/image";

import info from "../../../public/images/infoicon.svg";
import Popup from "components/popup";

const Info: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Popup className={"max-w-[300px]"} content={children}>
    <Image src={info} alt="info" />
  </Popup>
);

export default Info;
