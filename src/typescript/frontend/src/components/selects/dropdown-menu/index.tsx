import React from "react";

import { DropdownMenuWrapper } from "./styled";
import { DropdownMenuItem } from "./components";

import { type DropdownMenuProps } from "../types";

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onClick,
  value,
  options,
  isMultiple,
  values,
  onHover,
  ...props
}) => {
  return (
    <DropdownMenuWrapper {...props}>
      {options.map((option, index) => {
        const { title } = option;

        return (
          <DropdownMenuItem
            key={index}
            onClick={onClick}
            onHover={onHover}
            value={value}
            isMultiple={isMultiple}
            values={values}
            index={index}
            option={option}
            title={title}
          />
        );
      })}
    </DropdownMenuWrapper>
  );
};
