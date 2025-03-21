import React from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";

import { Text } from "components/text";
import Arrow from "components/svg/icons/Arrow";

import { type MobileMenuItemProps } from "./types";
import { StyledItemWrapper } from "./styled";
import { cn } from "lib/utils/class-name";

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({
  withIcon,
  title,
  onClick = () => {},
  borderBottom = true,
  pill,
}) => {
  const { t } = translationFunction();

  const { ref, replay } = useScramble({
    text: `${t(title)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledItemWrapper onMouseOver={replay} onClick={onClick} borderBottom={borderBottom}>
      <div className={cn(withIcon?.className, pill?.className)}>
        {withIcon?.icon}
        <Text
          textScale={withIcon ? "pixelHeading4" : "pixelHeading3"}
          color="black"
          textTransform="uppercase"
          ref={ref}
        />
        {pill?.pill}
      </div>
      {!withIcon && <Arrow width="18px" color="black" />}
    </StyledItemWrapper>
  );
};

export default MobileMenuItem;
