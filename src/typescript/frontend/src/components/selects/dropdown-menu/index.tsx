import React from "react";

import { DropdownMenuWrapper } from "./styled";
import { DropdownMenuItem } from "./components";

import { type DropdownMenuProps } from "../types";
import { DropdownMenuInner, StyledDropdownMenuItem } from "./components/dropdown-menu-item/styled";

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  onClick,
  onClose,
  value,
  options,
  isMultiple,
  values,
  onHover,
  ...props
}) => {
  return (
    <DropdownMenuWrapper {...props}>
      <StyledDropdownMenuItem disabled={false} key={"close"} onClick={onClose}>
        <DropdownMenuInner
          className="flex"
          style={{ justifyContent: "end", margin: "0", padding: "0" }}
        >
          <div className="med-pixel-text">X</div>
        </DropdownMenuInner>
      </StyledDropdownMenuItem>
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
