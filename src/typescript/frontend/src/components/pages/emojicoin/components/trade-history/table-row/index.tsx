"use client";

import React, { type PropsWithChildren } from "react";
import { useTooltip } from "hooks";
import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { toNominalPrice } from "@sdk/utils/nominal-price";
import { ExplorerLink } from "components/link/component";
import { darkColors } from "theme";
import { truncateAddress } from "@sdk/utils";
import "./table-row.css";

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
  "flex relative w-full font-forma body-sm transition-all duration-[50ms] group";
const TableCellStyles = "h-[33px]";

const TableRow = ({ item, showBorder }: TableRowDesktopProps) => {
  const { targetRef, tooltip } = useTooltip(
    <div className="text-black pixel-heading-4 uppercase">{item.emoji}</div>,
    {
      placement: "top",
    }
  );

  return (
    <tr className={TableRowStyles} id="grid-hover">
      <div
        className={
          "absolute w-full h-full bg-transparent group-hover:inline-flex border-r-[1px] " +
          "border-b-[1px] border-solid group-hover:border-[1px] group-hover:border-ec-blue z-[1] border-dark-gray" +
          (showBorder ? "" : " border-b-transparent")
        }
      />
      <td
        className={`min-w-[60px] xl:min-w-[71px] xl:ml-[0.5ch] xl:mr-[-0.5ch] ${TableCellStyles}`}
      >
        <div className="flex h-full">
          <span className="text-light-gray m-auto" ref={targetRef}>
            {item.rankIcon}
          </span>
          {tooltip}
        </div>
      </td>
      <td className={`w-[5%] md:w-[4.7%] ${TableCellStyles}`}></td>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${TableCellStyles}`}>
        <div className="ellipses">{toCoinDecimalString(item.apt, 3)}</div>
      </TableRowTextItem>
      <TableRowTextItem className={`w-[22%] md:w-[18%] ${TableCellStyles}`}>
        <div className="ellipses">{toCoinDecimalString(item.emoji, 3)}</div>
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
    </tr>
  );
};

export default TableRow;
