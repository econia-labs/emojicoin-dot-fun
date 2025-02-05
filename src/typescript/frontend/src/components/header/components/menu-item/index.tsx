import React from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";

import { Text } from "components/text";
import { FlexGap } from "@containers";

import { type MenuItemProps } from "./types";

const MenuItem: React.FC<MenuItemProps> = ({ title, onClick = () => {} }) => {
  const { t } = translationFunction();

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
        width={"auto"}
        maxWidth={"auto"}
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
