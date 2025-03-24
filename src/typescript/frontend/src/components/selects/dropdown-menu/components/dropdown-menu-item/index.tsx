import Checkbox from "components/checkbox";
import type { DropdownMenuItemProps } from "components/selects/types";
import Arrow from "components/svg/icons/Arrow";
import Text from "components/text";
import React from "react";
import { useScramble } from "use-scramble";

import { DropdownMenuInner, StyledDropdownMenuItem } from "./styled";

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  value,
  isMultiple,
  values,
  index,
  option,
  title,
  onHover,
}) => {
  const { ref, replay } = useScramble({
    text: `${title}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledDropdownMenuItem
      key={index}
      disabled={value === option}
      onMouseEnter={(e) => {
        e.stopPropagation();
        onHover(option);
        replay();
      }}
      onClick={(e) => {
        e.preventDefault();
        onClick(option);
      }}
    >
      <DropdownMenuInner>
        <div ref={ref} className="med-pixel-text">
          <Text color="black" textTransform="uppercase" ellipsis>
            {title}
          </Text>
        </div>
        {isMultiple && values ? (
          <Checkbox
            ml="2px"
            checked={values.includes(option)}
            onChange={() => {
              onClick(option);
            }}
          />
        ) : (
          <Arrow width="18px" color="black" />
        )}
      </DropdownMenuInner>
    </StyledDropdownMenuItem>
  );
};
