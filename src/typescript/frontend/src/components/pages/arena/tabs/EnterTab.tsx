import { type MarketStateModel } from "@sdk/indexer-v2/types";
import { EmojiTitle } from "../utils";
import { useState } from "react";
import { AptosInputLabel } from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { InputNumeric } from "components/inputs";
import Button from "components/button";
import { Switcher } from "components/switcher";
import { Emoji } from "utils/emoji";
import ProgressBar from "components/ProgressBar";
import { FormattedNumber } from "components/FormattedNumber";

const InnerWrapper = ({ children }: React.PropsWithChildren) => (
  <div
    className={
      `flex justify-between border border-solid border-dark-gray ` +
      `radii-xs px-[18px] py-[7px] items-center h-[55px] md:items-stretch max-w-[300px]`
    }
  >
    {children}
  </div>
);

const inputAndOutputStyles = `
  block text-[16px] font-normal h-[32px] outline-none w-full
  font-forma
  border-transparent !p-0 text-white
`;
const grayLabel = `
  pixel-heading-4 mb-[-6px] text-light-gray !leading-5 uppercase
`;

const EnterTabPickPhase: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  setMarket: (market: MarketStateModel) => void;
}> = ({ market0, market1, setMarket }) => {
  return (
    <div className="flex flex-col gap-[3em]">
      <div className="font-forma text-xl uppercase text-white text-center">Pick your side</div>
      <EmojiTitle
        market0Symbols={market0.market.symbolEmojis}
        market1Symbols={market1.market.symbolEmojis}
        onClicks={{
          emoji0: () => {
            setMarket(market0);
          },
          emoji1: () => {
            setMarket(market1);
          },
        }}
      />
    </div>
  );
};

const EnterTabAmountPhase: React.FC<{
  market: MarketStateModel;
  setAmount: (amount: bigint) => void;
}> = ({ market, setAmount }) => {
  const [innerAmount, setInnerAmount] = useState<bigint>(0n);
  return (
    <div className="flex flex-col gap-[1em] items-center">
      <div className="m-auto text-4xl xl:text-6xl">
        <Emoji emojis={market.market.symbolEmojis.join("")} />
      </div>
      <div className="font-forma text-xl uppercase text-white text-center">Deposit amount</div>
      <InnerWrapper>
        <div className="flex flex-col">
          <div className={grayLabel}>Amount</div>
          <InputNumeric
            className={inputAndOutputStyles + " bg-transparent leading-[32px]"}
            value={innerAmount}
            onUserInput={(v) => setInnerAmount(v)}
            onSubmit={() => setAmount(innerAmount)}
            decimals={8}
          />
        </div>
        <AptosInputLabel />
      </InnerWrapper>
      <Button scale="lg" onClick={() => setAmount(innerAmount)}>
        Next
      </Button>
    </div>
  );
};

const EnterTabLockPhase: React.FC<{
  market: MarketStateModel;
  amount: bigint;
  setLock: (lock: boolean) => void;
}> = ({ amount, setLock }) => {
  const [innerLock, setInnerLock] = useState<boolean>(false);
  return (
    <div className="flex flex-col gap-[3em] m-auto items-center">
      <div className="flex justify-between w-[300px]">
        <div className="font-forma text-2xl uppercase text-white text-center">Lock in</div>
        <div className="flex gap-[1em]">
          <div className="uppercase text-light-gray text-xl">Disabled</div>
          <Switcher checked={innerLock} onChange={(v) => setInnerLock(v.target.checked)} />
        </div>
      </div>
      <div className="w-[350px]">
        <div className="flex uppercase justify-between rounded-[3px] bg-ec-blue text-2xl text-black p-[1em]">
          <div>Deposit amount</div>
          <FormattedNumber value={amount} nominalize suffix=" APT" />
        </div>
        <div className="flex uppercase justify-between text-2xl text-light-gray p-[1em]">
          <div>Match amount</div>
          <FormattedNumber value={0n} nominalize suffix=" APT" />
        </div>
      </div>
      <div className="pb-[2em]">
        <Button scale="lg" onClick={() => setLock(innerLock)}>
          Enter
        </Button>
      </div>
    </div>
  );
};

const EnterTabSummary: React.FC<{ market: MarketStateModel; amount: bigint; lock: boolean }> = ({
  market,
  amount,
  lock,
}) => {
  return (
    <div className="text-white">
      {market.market.symbolEmojis.join("")} {amount.toString()} {lock.toString()}
    </div>
  );
};

export const EnterTab: React.FC<{ market0: MarketStateModel; market1: MarketStateModel }> = ({
  market0,
  market1,
}) => {
  const [market, setMarket] = useState<MarketStateModel>();
  const [amount, setAmount] = useState<bigint>();
  const [lock, setLock] = useState<boolean>();
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: "auto auto",
      }}
    >
      <div className="relative text-white flex">
        <div className="m-auto w-[33%] pb-[3em] pt-[2em]">
          <ProgressBar
            length={3}
            position={amount !== undefined ? 3 : market !== undefined ? 2 : 1}
          />
        </div>
        {market !== undefined && (
          <div className="absolute top-[1.5em] left-[1em]">
            <Button
              scale="lg"
              onClick={() => {
                if (amount === undefined) setMarket(undefined);
                else setAmount(undefined);
              }}
            >
              Back
            </Button>
          </div>
        )}
      </div>
      {market === undefined ? (
        <EnterTabPickPhase {...{ market0, market1, setMarket }} />
      ) : amount === undefined ? (
        <EnterTabAmountPhase {...{ market, setAmount }} />
      ) : lock === undefined ? (
        <EnterTabLockPhase {...{ market, amount, setLock }} />
      ) : (
        <EnterTabSummary {...{ market, amount, lock }} />
      )}
    </div>
  );
};
