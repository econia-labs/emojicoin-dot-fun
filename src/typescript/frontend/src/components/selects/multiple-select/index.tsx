"use client";

import React, { useState } from "react";

import Button from "components/button";
import { Column } from "@containers";
import Arrow from "components/svg/icons/Arrow";
import { Select } from "../select";
import { StyledButtonsWrapper } from "./styled";

import { useTooltip } from "hooks";

import { useThemeContext } from "context";
import { getTooltipStyles } from "../theme";

import { type MultipleSelectProps, type Option } from "../types";
import { type TooltipOptions } from "hooks/use-tooltip/types";
import { translationFunction } from "context/language-context";

const MultipleSelect: React.FC<MultipleSelectProps> = ({
  titleProps,
  placeholder = "Please select...",
  placeholderProps = { color: "lightGray" },
  dropdownComponent,
  dropdownWrapperProps,
  wrapperProps,
  iconProps,
  tooltipOptions,
  Icon = Arrow,
  value = [],
  title = value
    .map(({ title }) => title)
    .sort()
    .join(", "),
  options,
  setValue,
  onHover,
}) => {
  const [selectedOptions, setSelectedOptions] = useState(value);

  const { theme } = useThemeContext();
  const { t } = translationFunction();

  const DropdownComponent = dropdownComponent;

  const defaultTooltipOptions: TooltipOptions = {
    placement: "bottom",
    customStyles: getTooltipStyles(theme),
    trigger: "click",
  };

  const onSelectHandler = (option: Option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const onClose = () => {
    setVisible(false);
  };

  const onApplyCLick = () => {
    setVisible(false);
    setValue(selectedOptions);
  };

  const renderTooltip = () => {
    return (
      <Column>
        <DropdownComponent
          options={options}
          onClick={onDropdownMenuClick}
          onClose={onClose}
          isMultiple
          values={selectedOptions}
          onHover={onHover}
          {...dropdownWrapperProps}
        />

        <StyledButtonsWrapper>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedOptions(value);
              setVisible(false);
            }}
          >
            {t("Cancel")}
          </Button>

          <Button onClick={onApplyCLick}>{t("Apply")}</Button>
        </StyledButtonsWrapper>
      </Column>
    );
  };

  const { targetRef, tooltip, setVisible } = useTooltip(
    renderTooltip(),

    {
      ...defaultTooltipOptions,
      ...tooltipOptions,
    }
  );

  function onDropdownMenuClick(option: Option) {
    onSelectHandler(option);
  }

  return (
    <Select
      targetRef={targetRef}
      wrapperProps={wrapperProps}
      title={title}
      titleProps={titleProps}
      placeholder={placeholder}
      placeholderProps={placeholderProps}
      Icon={Icon}
      iconProps={iconProps}
      tooltip={tooltip}
    />
  );
};

export default MultipleSelect;
