import Arrow from "components/svg/icons/Arrow";
import { Text } from "components/text";
import { translationFunction } from "context/language-context";
import { cn } from "lib/utils/class-name";
import React from "react";
import { useScramble } from "use-scramble";

import { StyledItemWrapper } from "./styled";
import { type MobileMenuItemProps } from "./types";

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
