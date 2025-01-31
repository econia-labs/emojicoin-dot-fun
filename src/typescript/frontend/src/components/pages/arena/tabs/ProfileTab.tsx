import { ArenaMeleeModel, ArenaPositionsModel, MarketStateModel } from "@sdk/indexer-v2/types";
import { q64ToBig } from "@sdk/utils";
import Big from "big.js";
import { FormattedNumber } from "components/FormattedNumber";

export type ProfileTabProps = {
  positions: ArenaPositionsModel[],
  market0: MarketStateModel,
  market1: MarketStateModel,
  melees: ArenaMeleeModel[],
}

export const ProfileTab = ({
  positions,
  market0,
  market1,
  melees,
}: ProfileTabProps) => {
  const headerFlexColClass = "flex flex-col p-[2em] h-[100%] justify-between";
  const headerTitleClass = "text-light-gray text-xl uppercase";
  const headerValueClass = "text-white text-4xl font-forma uppercase";
  const currentPosition = positions.length > 0 ? positions[0] : undefined;
  // TODO: doublecheck the calculation below
  const locked = currentPosition ?  BigInt(q64ToBig(market0.lastSwap.avgExecutionPriceQ64).mul(currentPosition.emojicoin0Balance.toString()).add(q64ToBig(market1.lastSwap.avgExecutionPriceQ64).mul(currentPosition.emojicoin1Balance.toString())).round().toString()) : undefined;
  const profits = currentPosition ? locked! + currentPosition.withdrawals : undefined;
  const pnl = currentPosition ? (Big(profits!.toString()).div(currentPosition.deposits.toString()).sub(1)).mul(100).toNumber() : undefined;

  return <div className="grid h-[100%] w-[100%]" style={{
    gridTemplateRows: "1fr 2fr",
    gridTemplateColumns: "1fr 1fr",
  }}>
    <div className="border-b border-solid border-dark-gray text-ec-blue flex" style={{
      gridRow: "1",
      gridColumn: "1 / 3",
    }}>
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>Net deposits</div>
        { currentPosition
        ? <FormattedNumber className={headerValueClass} value={currentPosition.deposits} nominalize suffix=" APT" />
        : <div className={headerValueClass}>"--"</div> }
      </div>
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>Current locked value</div>
        { currentPosition
        ? <FormattedNumber className={headerValueClass} value={locked!} nominalize suffix=" APT" />
        : <div className={headerValueClass}>"--"</div> }
      </div>
      <div className={headerFlexColClass}>
        <div className={headerTitleClass}>Pnl</div>
        { currentPosition
        ? <span>
            <FormattedNumber className={headerValueClass + " " + ((pnl ?? 0) >= 0 ? "!text-green" : "!text-pink")} value={pnl!} suffix="%" />
            <span className={headerValueClass}> </span>
            <FormattedNumber className={headerValueClass + " !text-2xl"} value={BigInt(Big(currentPosition.deposits.toString()).mul(pnl! / 100).toString())} nominalize prefix="(" suffix=" APT)" />
          </span>
        : <div className={headerValueClass}>"--"</div> }
      </div>
    </div>
    {!currentPosition
    ?
      <div className="border-solid border-dark-gray broder-[1px] border-t-[0px] text-ec-blue" style={{
        gridRow: "2",
        gridColumn: "1 / 3"
      }}>2</div>
    :
      <>
        <div className="text-ec-blue" style={{
          gridRow: "2",
          gridColumn: "1"
        }}><History {...{positions, melees, market0, market1}} /></div>
        <div className="border-solid border-dark-gray border-[0] border-l-[1px] text-ec-blue" style={{
          gridRow: "2",
          gridColumn: "2"
        }}>3</div>
      </>
    }
  </div>;
};
