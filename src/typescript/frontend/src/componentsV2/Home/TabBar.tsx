"use client";
import React from "react";
import { TabSection, TabMetricsSection, TabGroup, TabFlex, TabText } from "./styled";

const TabBar = (): JSX.Element => {
  return (
    <>
      <TabSection>
        <TabGroup>
          <TabFlex>
            <TabText isActive>ALL COINS</TabText>
            <TabText>MORE TO COME...</TabText>
          </TabFlex>
        </TabGroup>
      </TabSection>
      <TabMetricsSection>
        <TabGroup>
          <TabFlex>
            <TabText isActive>LAST SWAP</TabText>
            <TabText isActive>MKT CAP</TabText>
          </TabFlex>
        </TabGroup>
      </TabMetricsSection>
    </>
  );
};

export default TabBar;
