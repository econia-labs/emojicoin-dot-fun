"use client";

import React, { useState } from "react";
import { isEqual } from "lodash";

import { TableRowDesktop, TableHeader } from "./components";
import { Table, Th, ThInner, HeaderTr, TBody, TrWrapper } from "components";
import { StyledPoolsWrapper } from "./styled";
import { Flex } from "@/containers";

import { HEADERS, DATA } from "./constants";

import { type DataType } from "./types";

const PoolsTable: React.FC = () => {
  const [dataMock, setDataMock] = useState<DataType[]>([...DATA, ...DATA, ...DATA, ...DATA, ...DATA]);

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
            <Flex>
              {HEADERS.map((th, index) => (
                <Th width={th.width} key={index}>
                  <ThInner>
                    <TableHeader item={th} isLast={HEADERS.length - 1 === index} sortData={sortData} />
                  </ThInner>
                </Th>
              ))}
            </Flex>
          </HeaderTr>
        </thead>
        <TBody height="calc(100vh - 353px)">
          {dataMock.map((item, index) => (
            <TrWrapper key={index}>
              <TableRowDesktop item={item} />
            </TrWrapper>
          ))}
        </TBody>
      </Table>
    </StyledPoolsWrapper>
  );
};

export default PoolsTable;
