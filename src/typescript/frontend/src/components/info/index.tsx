import React from "react";
import Image from "next/image";

import info from "../../../public/images/infoicon.svg";
import Popup from "components/popup";

const Info: React.FC<
  React.PropsWithChildren<{ popupClassName?: string; imageClassName?: string }>
> = ({ imageClassName, children, popupClassName }) => (
  <Popup className={`max-w-[300px] ${popupClassName}`} content={children}>
    <Image src={info} alt="info" className={imageClassName} />
  </Popup>
);

export default Info;
