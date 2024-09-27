"use client";

import React, { type PropsWithChildren } from "react";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { toNominalPrice } from "@sdk/utils/nominal-price";
import { ExplorerLink } from "components/link/component";
import { darkColors } from "theme";
import { formatDisplayName } from "@sdk/utils";
import "./table-row.css";
import Text from "components/text";
import Popup from "components/popup";

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

const TableRowStyles =
  "flex relative w-full font-forma body-sm transition-all duration-[50ms] border-b-[1px] border-solid z-[1] border-dark-gray";
const TableCellStyles = "h-[33px]";

const TableRow = ({ item, showBorder }: TableRowDesktopProps) => {
  return (
    <div id="grid-hover-outer">
      <tr
        className={
          TableRowStyles +
          (showBorder ? "" : " border-b-transparent") +
          " !hover:shadow-[0_35px_60px_-15px_var(--ec-blue)]"
        }
        id="grid-hover"
      >
        <td
          className={`min-w-[60px] xl:min-w-[71px] xl:ml-[0.5ch] xl:mr-[-0.5ch] ${TableCellStyles}`}
        >
          <Popup
            content={
              <Text textScale="pixelHeading4" lineHeight="20px" color="black">
                {item.rankIcon === "🐡"
                  ? "n00b"
                  : item.rankIcon === "🐳"
                    ? "365 UR SO JULIA"
                    : "SKILL ISSUE"}
              </Text>
            }
          >
            <div className="flex h-full relative">
              <span className="text-light-gray m-auto">{item.rankIcon}</span>
            </div>
          </Popup>
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
          {toNominalPrice(item.priceQ64).toFixed(9)}
        </TableRowTextItem>
        <td className={`group/explorer w-[22%] md:w-[18%] border-r-[1px] z-[2] ${TableCellStyles}`}>
          <ExplorerLink className="flex w-full h-full" value={item.version} type="txn">
            <span
              className={
                "text-light-gray group-hover/explorer:text-blue group-hover/explorer:underline" +
                " my-auto ml-auto mr-[20px]"
              }
            >
              {formatDisplayName(item.swapper)}
            </span>
          </ExplorerLink>
        </td>
      </tr>
    </div>
  );
};

export default TableRow;
