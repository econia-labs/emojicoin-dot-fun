"use client";

import AptosIconBlack from "@icons/AptosBlack";
import { ChevronUp, ChevronDown } from "lucide-react";
import { type StatsColumn, constructURLForStatsPage } from "./params";
import { useRouter } from "next/navigation";
import React from "react";

// Check if the row should be highlighted.
const getCN = (current: StatsColumn, comparator: StatsColumn) =>
  "hover:cursor-pointer" + (current === comparator ? " bg-opacity-[0.2] bg-ec-blue" : "");
const PossibleSortButton = ({
  sort,
  header,
  desc,
}: {
  sort: StatsColumn;
  header: StatsColumn;
  desc: boolean;
}) =>
  sort === header ? (
    <div key={`${sort}-sort`} className="hover:cursor-pointer w-fit">
      {desc ? <ChevronDown className="gap-1 h-4 w-4" /> : <ChevronUp className="gap-1 h-4 w-4" />}
    </div>
  ) : (
    <></>
  );

export const SortableHeader = ({
  desc,
  sort, // The current column for the page the user is currently on.
  header, // The column that this specific header allows sorting by.
  aptosIcon = false,
  text = header,
}: {
  sort: StatsColumn;
  header: StatsColumn;
  desc: boolean;
  aptosIcon?: boolean;
  text?: string;
}) => {
  const router = useRouter();
  const handleClick = () => {
    // If the header is different, always sort by descending, otherwise, toggle whatever `desc` currently is.
    const newDesc = sort !== header ? true : !desc;
    const newURL = constructURLForStatsPage({ sort: header, desc: newDesc });
    router.push(newURL);
  };

  return (
    <th onClick={handleClick} className={getCN(sort, header)}>
      <div className="flex flex-row gap-1 w-fit m-auto">
        <span>{text.replaceAll(/_/g, " ")}</span>
        {aptosIcon && <AptosIconBlack className="m-auto" height={13} width={13} />}
        <PossibleSortButton sort={sort} header={header} desc={desc} />
      </div>
    </th>
  );
};
