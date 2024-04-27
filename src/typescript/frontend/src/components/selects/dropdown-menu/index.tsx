import React from "react";

import { DropdownMenuItem, DropdownMenuWrapper, DropdownMenuInner } from "./styled";
import { Checkbox, Text } from "components";
import { Arrow } from "components/svg";

import { DropdownMenuProps } from "../types";

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onClick,
  value,
  options,
  isMultiple,
  values,
  ...props
}) => {
  return (
    <DropdownMenuWrapper {...props}>
      {options.map((option, index) => {
        const { title } = option;

        return (
          <DropdownMenuItem
            key={index}
            disabled={value === option}
            onClick={e => {
              e.preventDefault();

              onClick(option);
            }}
          >
            <DropdownMenuInner>
              <Text textScale="pixelHeading3" color="black" textTransform="uppercase" ellipsis>
                {title}
              </Text>

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
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuWrapper>
  );
};
