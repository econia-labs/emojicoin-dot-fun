"use client";

import React, { useState, type PropsWithChildren } from "react";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { toNominalPrice } from "@sdk/utils/nominal-price";
import { ExplorerLink } from "components/link/component";
import { darkColors } from "theme";
import { truncateAddress } from "@sdk/utils";
import "./table-row.css";
import { useThemeContext } from "context";
import Text from "components/text";
import { motion } from "framer-motion";

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
const TableCellStyles = "h-[33px]";

const TableRow = ({
  index,
  item,
  showBorder,
  numSwapsDisplayed,
  shouldAnimateAsInsertion,
}: TableRowDesktopProps) => {
  const { theme } = useThemeContext();
  const [isPopupVisible, setIsPopupVisible] = useState(false);

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
          "border-b-[1px] border-solid group-hover:border-[1px] group-hover:border-ec-blue z-[1] border-dark-gray" +
          (showBorder ? "" : " border-b-transparent")
        }
      />
      <td
        className={`min-w-[60px] xl:min-w-[71px] xl:ml-[0.5ch] xl:mr-[-0.5ch] ${TableCellStyles}`}
      >
        <div
          style={{
            display: isPopupVisible ? "flex" : "none",
            zIndex: 100,
            width: "max-content",
            position: "absolute",
            justifyContent: "space-between",
            padding: "10px 20px",
            backgroundColor: theme.colors.econiaBlue,
            borderRadius: theme.radii.small,
            left: "calc(100% - 10px)",
            bottom: "-3px",
          }}
          onMouseEnter={() => setIsPopupVisible(true)}
          onMouseLeave={() => setIsPopupVisible(false)}
        >
          <Text textScale="pixelHeading4" lineHeight="20px" color="black">
            {item.rankIcon === "🐡"
              ? "n00b"
              : item.rankIcon === "🐳"
                ? "365 UR SO JULIA"
                : "SKILL ISSUE"}
          </Text>
          <div
            style={{
              position: "absolute",
              width: "20px",
              height: "20px",
              background: theme.colors.econiaBlue,
              left: "-8px",
              top: "calc(50% - 10px)",
              border: `1px solid ${theme.colors.econiaBlue}`,
              transform: "rotate(45deg)",
            }}
          />
        </div>
        <div
          className="flex h-full relative"
          onMouseEnter={() => setIsPopupVisible(true)}
          onMouseLeave={() => setIsPopupVisible(false)}
        >
          <span className="text-light-gray m-auto">{item.rankIcon}</span>
        </div>
      </td>
      <td className={`w-[5%] md:w-[4.7%] ${TableCellStyles}`}></td>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${TableCellStyles}`}>
        <span className="ellipses">{toCoinDecimalString(item.apt, 3)}</span>
      </TableRowTextItem>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${TableCellStyles}`}>
        <span className="ellipses">{toCoinDecimalString(item.emoji, 3)}</span>
      </TableRowTextItem>
      <td className={`w-[0%] md:w-[0.3%] ${TableCellStyles}`}></td>
      <TableRowTextItem
        className={
          `hidden md:inline-block w-[22%] ${TableCellStyles} ` + "xl:ml-[-0.5ch] xl:mr-[0.5ch]"
        }
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
        className={`w-[22%] md:w-[18%] ${TableCellStyles} md:ml-[3ch] xl:ml-[0.5ch] xl:mr-[-0.5ch]`}
        color={item.type === "sell" ? darkColors.pink : darkColors.green}
      >
        {toNominalPrice(item.price).toFixed(9)}
      </TableRowTextItem>
      <td className={`group/explorer w-[22%] md:w-[18%] border-r-[1px] z-[2] ${TableCellStyles}`}>
        <ExplorerLink className="flex w-full h-full" value={item.version} type="txn">
          <span
            className={
              "text-light-gray group-hover/explorer:text-blue group-hover/explorer:underline" +
              " my-auto ml-auto mr-[20px]"
            }
          >
            {"0x" + truncateAddress(item.swapper).substring(2).toUpperCase()}
          </span>
        </ExplorerLink>
      </td>
    </motion.tr>
  );
};

export default TableRow;
