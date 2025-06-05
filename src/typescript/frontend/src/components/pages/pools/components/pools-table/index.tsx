"use client";

import type { PoolsData } from "app/pools/page";
import { EmptyTr, HeaderTr, Table, TBody, Th, ThInner } from "components";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import React, { useRef, useState } from "react";
import { getEmptyListTr } from "utils";

import useElementDimensions from "@/hooks/use-element-dimensions";
import { useTailwindBreakpoints } from "@/hooks/use-tailwind-breakpoints";
import type { SortMarketsBy } from "@/sdk/index";
import type { OrderByStrings } from "@/sdk/indexer-v2/const";

import { TableHeader, TableRowDesktop } from "./components";
import { HEADERS, MOBILE_HEADERS } from "./constants";
import { StyledPoolsWrapper } from "./styled";

interface PoolsTableProps {
  data: PoolsData[];
  index: number | undefined;
  sortBy: (sortBy: SortMarketsBy) => void;
  orderBy: (orderBy: OrderByStrings) => void;
  onSelect: (index: number) => void;
  onEnd: () => void;
}

const PoolsTable: React.FC<PoolsTableProps> = (props: PoolsTableProps) => {
  const { md } = useTailwindBreakpoints();
  const { offsetHeight: poolsTableBodyHeight } = useElementDimensions("poolsTableBody");
  const [selectedRow, setSelectedRow] = useState<number | undefined>(props.index);
  const [selectedSort, setSelectedSort] = useState<{
    col: SortByPageQueryParams;
    direction: OrderByStrings;
  }>({ col: "all_time_vol", direction: "desc" });

  const headers = md ? HEADERS : MOBILE_HEADERS;
  const tableRef = useRef<HTMLTableSectionElement>(null);
  return (
    <StyledPoolsWrapper>
      <Table>
        <thead>
          <HeaderTr>
            {headers.map((th, index) => (
              <Th width={th.width} key={index}>
                <ThInner>
                  <TableHeader
                    item={th}
                    isLast={HEADERS.length - 1 === index}
                    onClick={() => {
                      if (th.sortBy) {
                        if (th.sortBy === selectedSort.col) {
                          const newDirection = selectedSort.direction === "desc" ? "asc" : "desc";
                          props.orderBy(newDirection);
                          setSelectedSort({ col: selectedSort.col, direction: newDirection });
                        } else {
                          props.sortBy(th.sortBy as SortMarketsBy);
                          if (selectedSort.direction !== "desc") {
                            props.orderBy("desc");
                          }
                          setSelectedSort({
                            col: th.sortBy as SortByPageQueryParams,
                            direction: "desc",
                          });
                        }
                      }
                    }}
                  />
                </ThInner>
              </Th>
            ))}
          </HeaderTr>
        </thead>
        <TBody
          ref={tableRef}
          className="max-h-[204px] md:max-h-[340px] xl:max-h-none h-[50vh] xl:h-[calc(100vh-353px)]"
          id="poolsTableBody"
          onScroll={() => {
            if (tableRef && tableRef.current) {
              if (
                tableRef.current.offsetHeight + tableRef.current.scrollTop >=
                tableRef.current.scrollHeight
              ) {
                props.onEnd();
              }
            }
          }}
        >
          {props.data.map((item, index) => (
            <TableRowDesktop
              key={index}
              item={item}
              selected={selectedRow == index}
              onClick={() => {
                setSelectedRow(index);
                props.onSelect(index);
              }}
            />
          ))}
          {getEmptyListTr(poolsTableBodyHeight, props.data.length, EmptyTr)}
        </TBody>
      </Table>
    </StyledPoolsWrapper>
  );
};

export default PoolsTable;
