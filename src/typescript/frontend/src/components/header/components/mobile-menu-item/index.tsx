import React from "react";
import { useScramble } from "use-scramble";

import { useTranslation } from "context";

import { Text } from "components/text";
import Arrow from "components/svg/icons/Arrow";

import { type MobileMenuItemProps } from "./types";
import { StyledItemWrapper } from "./styled";

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({ title, onClick = () => {} }) => {
  const { t } = useTranslation();

  const { ref, replay } = useScramble({
    text: `${t(title)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledItemWrapper onMouseOver={replay} onClick={onClick}>
      <Text textScale="pixelHeading3" color="black" textTransform="uppercase" ref={ref} />

      <Arrow width="18px" color="black" />
    </StyledItemWrapper>
  );
};

export default MobileMenuItem;
