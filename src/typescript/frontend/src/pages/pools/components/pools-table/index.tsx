import React, { useState } from "react";
import { isEqual } from "lodash";

import { TableRowDesktop, TableHeader } from "./components";
import { Table, Th } from "components";
import { StyledPoolsWrapper } from "./styled";

import { HEADERS, DATA } from "./constants";

import { DataType } from "./types";

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
          <tr>
            {HEADERS.map((th, index) => (
              <Th width={th.width} p="5px 12px" key={index}>
                <TableHeader item={th} isLast={HEADERS.length - 1 === index} sortData={sortData} />
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataMock.map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
        </tbody>
      </Table>
    </StyledPoolsWrapper>
  );
};

export default PoolsTable;
