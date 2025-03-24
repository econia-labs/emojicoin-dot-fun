import Popup from "components/popup";
import Image from "next/image";
import React from "react";

import info from "../../../public/images/infoicon.svg";

const Info: React.FC<
  React.PropsWithChildren<{ popupClassName?: string; imageClassName?: string }>
> = ({ imageClassName, children, popupClassName }) => (
  <Popup className={`max-w-[300px] ${popupClassName}`} content={children}>
    <Image src={info} alt="info" className={imageClassName} />
  </Popup>
);

export default Info;
