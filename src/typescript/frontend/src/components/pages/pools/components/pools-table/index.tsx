"use client";

import React, { useState } from "react";

import { useElementDimensions, useMatchBreakpoints } from "hooks";

import { TableRowDesktop, TableHeader } from "./components";
import { Table, Th, EmptyTr, ThInner, HeaderTr, TBody } from "components";
import { StyledPoolsWrapper } from "./styled";

import { HEADERS, MOBILE_HEADERS } from "./constants";

import { getEmptyListTr } from "utils";
import type fetchSortedMarketData from "lib/queries/sorting/market-data";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import type { OrderByStrings } from "@sdk/queries/const";

export interface PoolsTableProps {
  data: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"];
  sortBy: (sortBy: SortByPageQueryParams) => void;
  orderBy: (orderBy: OrderByStrings) => void;
  onSelect: (index: number) => void;
}

const PoolsTable: React.FC<PoolsTableProps> = (props: PoolsTableProps) => {
  const { isMobile } = useMatchBreakpoints();
  const { offsetHeight: poolsTableBodyHeight } = useElementDimensions("poolsTableBody");
  const [selectedRow, setSelectedRow] = useState<number>();
  const [selectedSort, setSelectedSort] = useState<{
    col: SortByPageQueryParams;
    direction: OrderByStrings;
  }>({ col: "all_time_vol", direction: "desc" });

  const headers = isMobile ? MOBILE_HEADERS : HEADERS;
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
                          props.sortBy(th.sortBy as SortByPageQueryParams);
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
          height={{ _: "calc(50vh)", laptopL: "calc(100vh - 353px)" }}
          maxHeight={{ _: "204px", tablet: "340px", laptopL: "unset" }}
          id="poolsTableBody"
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
