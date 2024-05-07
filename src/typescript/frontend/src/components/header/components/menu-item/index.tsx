import React from "react";
import { useScramble } from "use-scramble";

import { useTranslation } from "context";

import { Link, Text } from "components";

import { MenuItemProps } from "./types";

const MenuItem: React.FC<MenuItemProps> = ({ title, path, width }) => {
  const { t } = useTranslation();

  const { ref, replay } = useScramble({
    text: `{ ${t(title)} }`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <Link key={title} href={path} onMouseOver={replay}>
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
    </Link>
  );
};

export default MenuItem;
