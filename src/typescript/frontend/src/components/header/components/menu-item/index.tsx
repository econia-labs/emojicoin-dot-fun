import React from "react";
import { useScramble } from "use-scramble";

import { useTranslation } from "context";

import { FlexGap, Text } from "components";

import { MenuItemProps } from "./types";

const MenuItem: React.FC<MenuItemProps> = ({ title, width, onClick = () => {} }) => {
  const { t } = useTranslation();

  const { ref, replay } = useScramble({
    text: `${t(title)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <FlexGap gap="8px" onMouseOver={replay} onClick={onClick}>
      <Text textScale="pixelHeading4" color="econiaBlue" textTransform="uppercase" fontSize="24px">
        {"{ "}
      </Text>
      <Text
        textScale="pixelHeading4"
        color="econiaBlue"
        width={width}
        maxWidth={width}
        textTransform="uppercase"
        fontSize="24px"
        ref={ref}
        ellipsis
      />
      <Text textScale="pixelHeading4" color="econiaBlue" textTransform="uppercase" fontSize="24px">
        {" }"}
      </Text>
    </FlexGap>
  );
};

export default MenuItem;
