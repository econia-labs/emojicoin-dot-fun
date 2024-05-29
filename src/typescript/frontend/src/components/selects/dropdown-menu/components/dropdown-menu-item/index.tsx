import React from "react";

import { useScramble } from "use-scramble";

import { StyledDropdownMenuItem, DropdownMenuInner } from "./styled";
import Checkbox from "components/checkbox";
import { Text } from "components/text";
import Arrow from "components/svg/icons/Arrow";

import { type DropdownMenuItemProps } from "components/selects/types";

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  onClick,
  value,
  isMultiple,
  values,
  index,
  option,
  title,
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
      onMouseEnter={replay}
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
