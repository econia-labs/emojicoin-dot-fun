"use client";
import React, { useMemo } from "react";
import { HeaderContainer, CoinTitle, CoinDescription, CoinDescriptionSpan } from "./styled";
import { useParams } from "next/navigation";

const CoinDetailsHeader = (): JSX.Element => {
  const params = useParams();
  const name = (params?.market as string) ?? "BLACK_HEART";

  const formattedName = useMemo(() => {
    return name.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [name]);

  return (
    <HeaderContainer>
      <div className="mx-0 md:-mx-4 flex flex-wrap mt-16">
        <div className="w-full px-10 sm-px-10 md:w-12/12 lg:w-12/12">
          <div className="wow fadeInUp group" data-wow-delay=".1s">
            <CoinTitle>{formattedName}</CoinTitle>
            <CoinDescription>
              1% of every trade goes to{" "}
              <CoinDescriptionSpan className="text-third underline">
                Project Zero’s Coral Collective,
              </CoinDescriptionSpan>
              a multiyear global initiative
              <br /> and the largest global conservation effort to save coral reefs from extinction.
            </CoinDescription>
          </div>
        </div>
      </div>
    </HeaderContainer>
  );
};

export default CoinDetailsHeader;
