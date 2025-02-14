"use client";

import { useNameResolver } from "@hooks/use-name-resolver";
import { formatDisplayName } from "@sdk/utils";
import { FormattedNumber } from "components/FormattedNumber";
import { ColoredPriceDisplay } from "components/misc/ColoredPriceDisplay";
import Popup from "components/popup";
import { motion } from "framer-motion";
import { useMemo, type PropsWithChildren } from "react";
import { ROUTES } from "router/routes";
import { darkColors } from "theme";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import { type TableRowDesktopProps } from "./types";

type TableRowTextItemProps = {
  className: string;
  outerClass?: string;
  color?: (typeof darkColors)[keyof typeof darkColors];
};

const TableRowTextItem = ({
  children,
  className,
  outerClass = "",
  color = darkColors.lightGray,
}: TableRowTextItemProps & PropsWithChildren) => (
  <td className={className}>
    <div className={`flex h-full ${outerClass}`}>
      <span className="ellipses my-auto" style={{ color }}>
        {children}
      </span>
    </div>
  </td>
);

const TableRowStyles = "flex relative w-full font-forma body-sm group";
const Height = "h-[33px]";

const TableRow = ({
  index,
  item,
  showBorder,
  numSwapsDisplayed,
  shouldAnimateAsInsertion,
}: TableRowDesktopProps) => {
  const resolvedName = useNameResolver(item.swapper);
  const { displayName, isANSName } = useMemo(() => {
    return {
      displayName: formatDisplayName(resolvedName),
      isANSName: item.swapper !== resolvedName,
    };
  }, [item.swapper, resolvedName]);

  return (
    <motion.tr
      className={TableRowStyles}
      layout
      initial={{
        opacity: 0,
        filter: "brightness(1) saturate(1)",
        boxShadow: "0 0 0px 0px rgba(0, 0, 0, 0)",
      }}
      whileHover={{
        filter: "brightness(1.05) saturate(1.1)",
        boxShadow: "0 0 9px 7px rgba(8, 108, 217, 0.2)",
        transition: { duration: 0.05 },
      }}
      animate={{
        opacity: 1,
        transition: {
          type: "just",
          delay: shouldAnimateAsInsertion ? 0.2 : (numSwapsDisplayed - index) * 0.02,
        },
      }}
    >
      <td
        className={
          "absolute w-full h-full bg-transparent group-hover:inline-flex " +
          "border-b-[1px] border-solid group-hover:border-[1px] group-hover:border-ec-blue z-[-1] border-dark-gray" +
          (showBorder ? "" : " border-b-transparent")
        }
      />
      <td className={`min-w-[60px] xl:min-w-[71px] xl:ml-[0.5ch] xl:mr-[-0.5ch] ${Height}`}>
        <Popup
          content={
            item.rankIcon === emoji("blowfish")
              ? "n00b"
              : item.rankIcon === emoji("spouting whale")
                ? "365 UR SO JULIA"
                : "SKILL ISSUE"
          }
          uppercase={false}
        >
          <div className="flex h-full relative">
            <Emoji className="text-light-gray m-auto" emojis={item.rankIcon} />
          </div>
        </Popup>
      </td>
      <td className={`w-[5%] md:w-[4.7%] ${Height}`}></td>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${Height}`}>
        <FormattedNumber value={item.apt} className="ellipses" decimals={3} nominalize />
      </TableRowTextItem>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${Height}`}>
        <FormattedNumber value={item.emoji} className="ellipses" decimals={3} nominalize />
      </TableRowTextItem>
      <td className={`w-[0%] md:w-[0.3%] ${Height}`}></td>
      <TableRowTextItem
        className={`hidden md:inline-block w-[22%] ${Height} ` + "xl:ml-[-0.5ch] xl:mr-[0.5ch]"}
      >
        {item.date.toLocaleString(undefined, {
          month: "2-digit" as const,
          day: "2-digit" as const,
          hour: "2-digit" as const,
          minute: "2-digit" as const,
          second: "2-digit" as const,
        })}
      </TableRowTextItem>
      <TableRowTextItem
        className={`w-[22%] md:w-[18%] ${Height} md:ml-[3ch] xl:ml-[0.5ch] xl:mr-[-0.5ch]`}
        color={item.type === "sell" ? darkColors.pink : darkColors.green}
      >
        <ColoredPriceDisplay
          price={item.priceQ64}
          decimals={9}
          colorFor={item.type}
          className="ellipses"
          q64
        />
      </TableRowTextItem>
      <td className={`group/explorer w-[22%] md:w-[18%] border-r-[1px] z-[2] ${Height}`}>
        <a href={`${ROUTES.wallet}/${item.swapper}`} className="flex h-full">
          <span
            className={
              `${isANSName ? "brightness-[1.4] contrast-[1.4]" : ""}` +
              " text-light-gray group-hover/explorer:text-blue group-hover/explorer:underline" +
              " my-auto ml-auto mr-[20px]"
            }
          >
            {displayName}
          </span>
        </a>
      </td>
    </motion.tr>
  );
};

export default TableRow;
