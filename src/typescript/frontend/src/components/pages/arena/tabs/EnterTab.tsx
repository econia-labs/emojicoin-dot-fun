import { type MarketStateModel } from "@sdk/indexer-v2/types";
import { EmojiTitle } from "../utils";
import { useMemo, useState } from "react";
import { AptosInputLabel } from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { InputNumeric } from "components/inputs";
import Button from "components/button";
import { Switcher } from "components/switcher";
import { Emoji } from "utils/emoji";
import ProgressBar from "components/ProgressBar";
import { FormattedNumber } from "components/FormattedNumber";
import { Enter } from "@/contract-apis/emojicoin-arena";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { toCoinTypes } from "@sdk/markets";

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
    <div className="flex flex-col gap-[2em] items-center">
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
      <Button scale="lg" onClick={() => setAmount(innerAmount)} disabled={innerAmount <= 0n}>
        Next
      </Button>
    </div>
  );
};

const EnterTabLockPhase: React.FC<{
  market: MarketStateModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
  amount: bigint;
  setLock: (lock: boolean) => void;
}> = ({ market, market0, market1, amount, setLock }) => {
  const [innerLock, setInnerLock] = useState<boolean>(false);

  const { aptos, account, submit } = useAptos();

  return (
    <div className="flex flex-col gap-[2em] m-auto items-center w-[100%]">
      <div className="flex justify-between w-[300px]">
        <div className="font-forma text-2xl uppercase text-white text-center">Lock in</div>
        <div className="flex gap-[1em] items-center">
          <div className="uppercase text-light-gray text-xl">
            {innerLock ? "Enabled" : "Disabled"}
          </div>
          <Switcher checked={innerLock} onChange={(v) => setInnerLock(v.target.checked)} />
        </div>
      </div>
      <div className="max-w-[350px] w-[100%]">
        <div className="flex justify-between p-[0.8em] rounded-[3px] bg-ec-blue text-2xl text-black uppercase">
          <div>Deposit amount</div>
          <FormattedNumber value={amount} nominalize suffix=" APT" />
        </div>
        <div className="flex uppercase justify-between text-2xl text-light-gray py-[0.8em] mx-[0.8em] border-dashed border-b-[1px] border-light-gray ">
          <div>Match amount</div>
          <FormattedNumber
            value={innerLock ? BigInt(Math.floor(Math.min(5 * 10 ** 8, Number(amount / 2n)))) : 0n}
            nominalize
            suffix=" APT"
          />
        </div>
        <div className="pt-[2em] grid place-items-center">
          <ButtonWithConnectWalletFallback>
            <Button
              scale="lg"
              onClick={() => {
                if (!account) return;
                const { emojicoin: emojicoin0, emojicoinLP: emojicoinLP0 } = toCoinTypes(
                  market0.market.marketAddress
                );
                const { emojicoin: emojicoin1, emojicoinLP: emojicoinLP1 } = toCoinTypes(
                  market1.market.marketAddress
                );
                const { emojicoin } = toCoinTypes(market.market.marketAddress);
                const payloadBuilder = () =>
                  Enter.builder({
                    aptosConfig: aptos.config,
                    user: account.address,
                    inputAmount: amount,
                    lockIn: innerLock,
                    typeTags: [emojicoin0, emojicoinLP0, emojicoin1, emojicoinLP1, emojicoin],
                  });
                submit(payloadBuilder).then(() => setLock(innerLock));
              }}
            >
              Enter
            </Button>
          </ButtonWithConnectWalletFallback>
        </div>
      </div>
    </div>
  );
};

const EnterTabSummary: React.FC<{
  market: MarketStateModel;
  amount: bigint;
  lock: boolean;
  matchAmount: bigint;
}> = ({ market, amount, matchAmount }) => {
  return (
    <div className="flex flex-col justify-between items-center h-[100%]">
      <Emoji
        className="text-4xl xl:text-6xl pt-[1em]"
        emojis={market.market.symbolEmojis.join("")}
      />
      <div className="flex flex-col justify-between items-center gap-[.5em]">
        <div className="text-light-gray uppercase text-2xl tracking-widest">Locked in</div>
        <FormattedNumber
          className="font-forma text-6xl text-white"
          value={amount}
          nominalize
          suffix=" APT"
        />
        <div className="flex flex-col items-center gap-[.4em]">
          <div className="text-light-gray uppercase text-xl tracking-wider">Matched</div>
          <FormattedNumber
            className="font-forma text-white text-md"
            value={matchAmount}
            nominalize
            prefix="+"
            suffix=" APT"
          />
        </div>
      </div>
      <div className="flex justify-evenly w-[100%] pb-[2em]">
        <Button scale="lg">Top off</Button>
        <Button scale="lg">Swap</Button>
        <Button scale="lg">Tap out</Button>
      </div>
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

  // TODO: Fix this logic using the real one
  const matchAmount = useMemo(
    () =>
      lock
        ? amount !== undefined
          ? BigInt(Math.floor(Math.min(5 * 10 ** 8, Number(amount / 2n))))
          : 0n
        : 0n,
    [amount, lock]
  );

  if (market !== undefined && amount !== undefined && lock !== undefined) {
    return <EnterTabSummary {...{ market, amount, lock, matchAmount }} />;
  }

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
      ) : (
        <EnterTabLockPhase {...{ market, market0, market1, amount, setLock }} />
      )}
    </div>
  );
};
