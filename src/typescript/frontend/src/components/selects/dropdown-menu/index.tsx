import React from "react";

import { type DropdownMenuProps } from "../types";
import { DropdownMenuItem } from "./components";
import { DropdownMenuInner, StyledDropdownMenuClose } from "./components/dropdown-menu-item/styled";
import { DropdownMenuWrapper } from "./styled";

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
      <StyledDropdownMenuClose key="close" disabled={false} onClick={onClose}>
        <DropdownMenuInner
          className="flex"
          style={{ justifyContent: "end", margin: "0", padding: "0" }}
        >
          <div className="med-pixel-text lowercase">x</div>
        </DropdownMenuInner>
      </StyledDropdownMenuClose>
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
