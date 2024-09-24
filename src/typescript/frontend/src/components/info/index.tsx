import React from "react";
import Image from "next/image";

import info from "../../../public/images/infoicon.svg";
import { PixelPopup } from "components/popup";

const Info: React.FC<
  { popupClassName?: string; imageClassName?: string, children: string }
> = ({ imageClassName, children, popupClassName }) => (
  <PixelPopup className={`max-w-[300px] ${popupClassName}`} content={children}>
    <Image src={info} alt="info" className={imageClassName} />
  </PixelPopup>
);

export default Info;
