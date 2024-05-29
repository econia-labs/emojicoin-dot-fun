import React from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";

import { Text } from "components/text";
import Arrow from "components/svg/icons/Arrow";

import { type MobileMenuItemProps } from "./types";
import { StyledItemWrapper } from "./styled";

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({
  title,
  onClick = () => {},
  borderBottom = true,
}) => {
  const { t } = translationFunction();

  const { ref, replay } = useScramble({
    text: `${t(title)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledItemWrapper onMouseOver={replay} onClick={onClick} borderBottom={borderBottom}>
      <Text textScale="pixelHeading3" color="black" textTransform="uppercase" ref={ref} />

      <Arrow width="18px" color="black" />
    </StyledItemWrapper>
  );
};

export default MobileMenuItem;
