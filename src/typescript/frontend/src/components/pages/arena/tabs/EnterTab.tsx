import { type MarketStateModel } from "@sdk/indexer-v2/types";
import { EmojiTitle } from "../utils";
import { useMemo, useState } from "react";
import { AptosInputLabel } from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { InputNumeric } from "components/inputs";
import Button from "components/button";
import { Switcher } from "components/switcher";
import { GlowingEmoji } from "utils/emoji";
import ProgressBar from "components/ProgressBar";
import { FormattedNumber } from "components/FormattedNumber";
import { Enter } from "@/contract-apis/emojicoin-arena";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { toCoinTypes } from "@sdk/markets";
import { CloseIcon } from "components/svg";

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
    <div className="grid gap-[3em] place-items-center h-[100%] w-[100%]">
      <div className="w-[100%]">
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
    </div>
  );
};

const EnterTabAmountPhase: React.FC<{
  market: MarketStateModel;
  setAmount: (amount: bigint) => void;
}> = ({ market, setAmount }) => {
  const [innerAmount, setInnerAmount] = useState<bigint>(0n);
  return (
    <div className="grid place-items-center h-[100%]">
      <div className="flex flex-col gap-[2em] items-center">
        <div className="m-auto text-4xl xl:text-6xl">
          <GlowingEmoji emojis={market.market.symbolEmojis.join("")} />
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
                    entrant: account.address,
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
  const [isTappingOut, setIsTappingOut] = useState<boolean>(false);
  const formatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 2,
  });
  const matchNumberText = formatter.format(Number(matchAmount) / 10 ** 8);
  const tapOutButtonText = `Accept and exit, incurring a ${matchNumberText} APT tap out fee`;
  return (
    <div className="relative h-[100%]">
      {isTappingOut && (
        <div
          className="absolute w-[100%] h-[100%] z-[10] grid place-items-center"
          style={{
            background: "#00000050",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">
              Are you sure you want to tap out?
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              You have been matched a total of {matchNumberText} APT since your first deposit to an
              empty escrow. To exit before the melee is over, you must pay back the{" "}
              {matchNumberText} APT in order to tap out.
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              If you don&apos;t want to pay the tap out penalty, wait to exit until the melee has
              ended and then you&apos;ll be able to keep all matched deposits.
            </div>
          </div>
          <Button scale="lg">{tapOutButtonText}</Button>
          <CloseIcon
            onClick={() => setIsTappingOut(false)}
            className="absolute right-[.5em] top-[.5em] p-[.5em] h-[2.5em] w-[2.5em] cursor-pointer"
            color="econiaBlue"
          />
        </div>
      )}
      <div className="flex flex-col justify-between items-center h-[100%] pt-[3em]">
        <GlowingEmoji
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
          <Button scale="lg" onClick={() => setIsTappingOut(true)}>
            Tap out
          </Button>
        </div>
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
    <div className="relative flex flex-col h-[100%] gap-[3em]">
      <div className="absolute left-0 w-[100%] text-white flex">
        <div className="m-auto w-[33%] pt-[2em]">
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
