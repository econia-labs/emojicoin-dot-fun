"use client";

import React, { useState } from "react";
import { isEqual } from "lodash";

import { useElementDimensions, useMatchBreakpoints } from "hooks";

import { TableRowDesktop, TableHeader } from "./components";
import { Table, Th, EmptyTr, ThInner, HeaderTr, TBody } from "components";
import { StyledPoolsWrapper } from "./styled";

import { HEADERS, DATA, MOBILE_HEADERS } from "./constants";

import { type DataType } from "./types";
import { getEmptyListTr } from "utils";

const PoolsTable: React.FC = () => {
  const [dataMock, setDataMock] = useState<DataType[]>([...DATA, ...DATA, ...DATA, ...DATA, ...DATA]);
  const { isMobile } = useMatchBreakpoints();
  const { offsetHeight: poolsTableBodyHeight } = useElementDimensions("poolsTableBody");

  const headers = isMobile ? MOBILE_HEADERS : HEADERS;
  const sortData = (sortBy: Exclude<keyof DataType, "pool">) => {
    const arrCopy = [...dataMock];
    const sortedData = arrCopy.sort((a, b) => b[sortBy] - a[sortBy]);

    if (isEqual(sortedData, dataMock)) {
      setDataMock(sortedData.reverse());
    }

    setDataMock(sortedData);
  };

  return (
    <StyledPoolsWrapper>
      <Table>
        <thead>
          <HeaderTr>
            {headers.map((th, index) => (
              <Th width={th.width} key={index}>
                <ThInner>
                  <TableHeader item={th} isLast={HEADERS.length - 1 === index} sortData={sortData} />
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
          {dataMock.map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
          {getEmptyListTr(poolsTableBodyHeight, dataMock.length, EmptyTr)}
        </TBody>
      </Table>
    </StyledPoolsWrapper>
  );
};

export default PoolsTable;
