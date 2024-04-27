import { useState } from "react";

import { DropdownMenu } from "./";
import SingleSelect from "./single-select";
import MultipleSelect from "./multiple-select";

import { Option } from "./types";

export default {
  title: "Components/Dropdowns",
};

const options: Option[] = [
  { title: "1", value: 1 },
  { title: "2", value: 2 },
  { title: "LongLongLongLongLongLongLongLongLongLongLongLong", value: 3 },
];

const options1: Option[] = [
  { title: "1", value: 1 },
  { title: "2", value: 2 },
  { title: "3", value: 3 },
  { title: "4", value: 4 },
  { title: "5", value: 5 },
];

export const SelectSingle = () => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  return (
    <SingleSelect
      wrapperProps={{ width: "300px" }}
      title={selectedOption?.title}
      value={selectedOption}
      setValue={setSelectedOption}
      dropdownComponent={DropdownMenu}
      options={options}
      dropdownWrapperProps={{ width: "300px" }}
      titleProps={{ color: "darkGrey" }}
    />
  );
};

export const SelectMultiple = () => {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

  return (
    <MultipleSelect
      wrapperProps={{ width: "300px" }}
      value={selectedOptions}
      options={options1}
      setValue={setSelectedOptions}
      dropdownComponent={DropdownMenu}
      dropdownWrapperProps={{
        width: "300px",
      }}
    />
  );
};
