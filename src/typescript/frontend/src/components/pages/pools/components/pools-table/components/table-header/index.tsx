import React, { useState } from "react";
import Image from "next/image";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";
import { useMatchBreakpoints } from "hooks";

import { FlexGap, Flex } from "@containers";
import { Text } from "components/text";

import { Arrows } from "components/svg";

import { type TableHeaderProps } from "./types";
import Prompt from "components/prompt";

import info from "../../../../../../../../public/images/infoicon.svg";

const TableHeader: React.FC<TableHeaderProps> = ({ item, isLast, onClick }) => {
  const { t } = translationFunction();
  const { isMobile } = useMatchBreakpoints();
  const [showAPRInfoPrompt, setShowAPRInfoPrompt] = useState<boolean>(false);

  const { ref, replay } = useScramble({
    text: `${t(item.text)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <Flex justifyContent={isLast ? "end" : undefined}>
      <FlexGap
        cursor={item.sortBy ? "pointer" : undefined}
        gap="10px"
        alignItems="center"
        width="fit-content"
        onClick={onClick}
        onMouseEnter={replay}
        ellipsis
      >
        <Text
          textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
          textTransform="uppercase"
          color="econiaBlue"
          $fontWeight="regular"
          ellipsis
          ref={ref}
        >
          {t(item.text)}
        </Text>
        {item.sortBy && !isMobile ? <Flex>{!isLast && <Arrows color="econiaBlue" />}</Flex> : null}
      </FlexGap>
      {isLast && (
        <div className="relative">
          <Image
            src={info}
            alt="info"
            onTouchStart={() => setShowAPRInfoPrompt(!showAPRInfoPrompt)}
            onMouseEnter={() => setShowAPRInfoPrompt(true)}
            onMouseLeave={() => setShowAPRInfoPrompt(false)}
          />
          <Prompt
            text="On extremly volatile markets, APR and WPR are impossible to predict. When such values are under -50% or above 1000%, they are represented by 😭 and 🤯 respectively."
            visible={showAPRInfoPrompt}
            close={false}
            width={300}
            top={false}
          />
        </div>
      )}
    </Flex>
  );
};

export default TableHeader;
