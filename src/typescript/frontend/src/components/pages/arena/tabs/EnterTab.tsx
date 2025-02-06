import type { ArenaPositionsModel, MarketStateModel } from "@sdk/indexer-v2/types";
import { EmojiTitle, lockedTernary, marketTernary } from "../utils";
import { type PropsWithChildren, useCallback, useEffect, useState } from "react";
import { AptosInputLabel } from "components/pages/emojicoin/components/trade-emojicoin/InputLabels";
import { InputNumeric } from "components/inputs";
import Button from "components/button";
import { Switcher } from "components/switcher";
import { GlowingEmoji } from "utils/emoji";
import ProgressBar from "components/ProgressBar";
import { FormattedNumber } from "components/FormattedNumber";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { CloseIcon } from "components/svg";
import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { ARENA_MODULE_ADDRESS } from "@sdk/const";
import { emoji } from "utils";
import { q64ToBig } from "@sdk/utils";
import Loading from "components/loading";
import { useEnterTransactionBuilder } from "lib/hooks/transaction-builders/use-enter-builder";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useArenaSwapTransactionBuilder } from "lib/hooks/transaction-builders/use-arena-swap-builder";

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

const BlurModal: React.FC<PropsWithChildren & { close: () => void }> = ({ children, close }) => (
  <div
    className="absolute w-[100%] h-[100%] z-[10] p-[1em] grid place-items-center"
    style={{
      background: "#00000050",
      backdropFilter: "blur(8px)",
    }}
  >
    {children}
    <CloseIcon
      onClick={close}
      className="absolute right-[.5em] top-[.5em] p-[.5em] h-[2.5em] w-[2.5em] cursor-pointer"
      color="econiaBlue"
    />
  </div>
);

const EnterTabPickPhase: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  setMarket: (market: MarketStateModel) => void;
  error: boolean;
  closeError: () => void;
  cranked: boolean;
  closeCranked: () => void;
  nextPhase: () => void;
}> = ({ market0, market1, setMarket, error, closeError, cranked, closeCranked, nextPhase }) => {
  return (
    <div className="relative grid gap-[3em] place-items-center h-[100%] w-[100%]">
      {error && (
        <BlurModal close={closeError}>
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">Entry cancel or error</div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              We have detected that the entry was either cancelled or an error occured during the
              entry process. No funds were moved and you did not enter the melee.
            </div>
          </div>
          <Button scale="lg" onClick={closeError}>
            Close
          </Button>
        </BlurModal>
      )}
      {cranked && (
        <BlurModal close={closeCranked}>
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">
              You just cranked the melee!
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              In order for the next melee to start, a user has to crank the package. You happen to
              be the one that cranked, and thus started the next melee!
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase text-center text-2xl">
              {emoji("party popper")} Congratulations {emoji("party popper")}
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              As a result, no funds have been moved, and the enter to the previous melee was
              cancelled.
            </div>
          </div>
          <Button scale="lg" onClick={closeCranked}>
            Close
          </Button>
        </BlurModal>
      )}
      <div className="w-[100%]">
        <div className="font-forma text-xl uppercase text-white text-center">Pick your side</div>
        <EmojiTitle
          market0Symbols={market0.market.symbolEmojis}
          market1Symbols={market1.market.symbolEmojis}
          onClicks={{
            emoji0: () => {
              setMarket(market0);
              nextPhase();
            },
            emoji1: () => {
              setMarket(market1);
              nextPhase();
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
  nextPhase: () => void;
}> = ({ market, setAmount, nextPhase }) => {
  const [innerAmount, setInnerAmount] = useState<bigint>(0n);
  return (
    <div className="grid place-items-center h-[100%]">
      <div className="flex flex-col gap-[2em] items-center">
        <div className="m-auto text-6xl">
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
        <Button
          scale="lg"
          onClick={() => {
            setAmount(innerAmount);
            nextPhase();
          }}
          disabled={innerAmount <= 0n}
        >
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
  errorOut: () => void;
  setCranked: () => void;
  position?: ArenaPositionsModel | null;
  setPosition: (position: ArenaPositionsModel | null) => void;
}> = ({ market, market0, market1, amount, errorOut, setCranked, position, setPosition }) => {
  const [innerLock, setInnerLock] = useState<boolean>(false);

  const { account, submit } = useAptos();

  const transactionBuilder = useEnterTransactionBuilder(
    amount,
    innerLock,
    market0.market.marketAddress,
    market1.market.marketAddress,
    market.market.marketAddress
  );

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
                submit(transactionBuilder).then((r) => {
                  if (!r || r?.error) {
                    errorOut();
                  } else if (
                    (r.response as UserTransactionResponse).events.find(
                      (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Melee`
                    )
                  ) {
                    setCranked();
                  } else {
                    const enterEvent = (r.response as UserTransactionResponse).events.find(
                      (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Enter`
                    )!;

                    if (position && position.open) {
                      setPosition({
                        ...position,
                        deposits: position.deposits + BigInt(enterEvent.data.input_amount),
                        matchAmount: position.matchAmount + BigInt(enterEvent.data.match_amount),
                        emojicoin0Balance:
                          position.emojicoin0Balance + BigInt(enterEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance:
                          position.emojicoin1Balance + BigInt(enterEvent.data.emojicoin_1_proceeds),
                      });
                    } else {
                      setPosition({
                        open: true,
                        user: account.address as `0x${string}`,
                        meleeId: BigInt(enterEvent.data.melee_id),
                        deposits: BigInt(enterEvent.data.input_amount),
                        lastExit: undefined,
                        matchAmount: BigInt(enterEvent.data.match_amount),
                        withdrawals: 0n,
                        emojicoin0Balance: BigInt(enterEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance: BigInt(enterEvent.data.emojicoin_1_proceeds),
                      });
                    }
                  }
                });
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
  market0: MarketStateModel;
  market1: MarketStateModel;
  market: MarketStateModel;
  position: ArenaPositionsModel;
  setPosition: (position: ArenaPositionsModel | null) => void;
  topOff: () => void;
  tapOut: () => void;
  swap: () => void;
}> = ({ market, market0, market1, position, setPosition, topOff, tapOut, swap }) => {
  const [isTappingOut, setIsTappingOut] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const formatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 2,
  });
  const matchNumberText = formatter.format(Number(position.matchAmount) / 10 ** 8);
  const tapOutButtonText = `Accept and exit, incurring a ${matchNumberText} APT tap out fee`;
  const { account, submit } = useAptos();
  const exitTransactionBuilder = useExitTransactionBuilder(
    market0.market.marketAddress,
    market1.market.marketAddress
  );
  const swapTransactionBuilder = useArenaSwapTransactionBuilder(
    market0.market.marketAddress,
    market1.market.marketAddress
  );
  const amount = marketTernary(
    position,
    BigInt(
      q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
        .mul(position.emojicoin0Balance.toString())
        .round()
        .toString()
    ),
    BigInt(
      q64ToBig(market1.lastSwap.avgExecutionPriceQ64)
        .mul(position.emojicoin1Balance.toString())
        .round()
        .toString()
    )
  );

  const onTapOut = useCallback(() => {
    if (!account) return;
    submit(exitTransactionBuilder).then((r) => {
      if (!r || r?.error) {
        console.error("Could not exit", { error: r?.error });
      } else {
        tapOut();
        setPosition(null);
      }
    });
  }, [account, exitTransactionBuilder, tapOut, setPosition, submit]);

  return (
    <div className="relative h-[100%]">
      {isTappingOut && (
        <BlurModal close={() => setIsTappingOut(false)}>
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
          <ButtonWithConnectWalletFallback>
            <Button scale="lg" onClick={onTapOut}>
              {tapOutButtonText}
            </Button>
          </ButtonWithConnectWalletFallback>
        </BlurModal>
      )}
      {isSwapping && (
        <BlurModal close={() => setIsSwapping(false)}>
          <div className="flex flex-col justify-between items-center h-[100%] py-[3em]">
            <GlowingEmoji
              className="text-6xl mt-[1em]"
              emojis={marketTernary(
                position,
                market1.market.symbolEmojis.join(""),
                market0.market.symbolEmojis.join("")
              )}
            />
            <div className="flex flex-col justify-between items-center gap-[.5em]">
              <div className="text-light-gray uppercase text-2xl tracking-widest">
                Swapping holding
              </div>
              <FormattedNumber
                className="font-forma text-6xl text-white"
                value={amount}
                nominalize
                suffix=" APT"
              />
            </div>
            <ButtonWithConnectWalletFallback>
              <Button
                scale="lg"
                onClick={() => {
                  if (!account) return;
                  submit(swapTransactionBuilder).then((r) => {
                    if (!r || r?.error) {
                      console.error("Could not swap", { error: r?.error });
                    } else {
                      const swapEvent = (r.response as UserTransactionResponse).events.find(
                        (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Swap`
                      )!;
                      swap();
                      setPosition({
                        ...position,
                        emojicoin0Balance: BigInt(swapEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance: BigInt(swapEvent.data.emojicoin_1_proceeds),
                      });
                      setIsSwapping(false);
                    }
                  });
                }}
              >
                Swap
              </Button>
            </ButtonWithConnectWalletFallback>
          </div>
        </BlurModal>
      )}
      <div className="flex flex-col justify-between items-center h-[100%] pt-[3em]">
        <GlowingEmoji className="text-6xl mt-[1em]" emojis={market.market.symbolEmojis.join("")} />
        <div className="flex flex-col justify-between items-center gap-[.5em]">
          <div className="text-light-gray uppercase text-2xl tracking-widest">
            {lockedTernary(position, "Locked in", "Deposited")}
          </div>
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
              value={position.matchAmount}
              nominalize
              prefix="+"
              suffix=" APT"
            />
          </div>
        </div>
        <div className="flex justify-evenly w-[100%] pb-[2em]">
          <Button scale="lg" onClick={topOff}>
            Top off
          </Button>
          <Button scale="lg" onClick={() => setIsSwapping(true)}>
            Swap
          </Button>
          <Button
            scale="lg"
            onClick={() => {
              lockedTernary(position, () => setIsTappingOut(true), onTapOut)();
            }}
          >
            {lockedTernary(position, "Tap out", "Exit")}
          </Button>
        </div>
      </div>
    </div>
  );
};

type Phase = "pick" | "amount" | "lock" | "summary";

const Container: React.FC<
  PropsWithChildren & {
    progress: number;
    phase: Phase;
    setPhase: (phase: Phase) => void;
    position?: ArenaPositionsModel | null;
  }
> = ({ children, progress, phase, setPhase, position }) => (
  <div className="relative flex flex-col h-[100%] gap-[3em]">
    <div className="absolute left-0 w-[100%] text-white flex">
      <div className="m-auto w-[33%] pt-[2em]">
        <ProgressBar length={3} position={progress} />
      </div>
      {(phase === "amount" || phase === "lock") && (
        <div className="absolute top-[1.5em] left-[1em]">
          <Button
            scale="lg"
            onClick={() => {
              if (phase === "amount") {
                if (position?.open) setPhase("summary");
                else setPhase("pick");
              } else if (phase === "lock") setPhase("amount");
            }}
          >
            Back
          </Button>
        </div>
      )}
    </div>
    {children}
  </div>
);

export const EnterTab: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  position?: ArenaPositionsModel | null;
  setPosition: (position: ArenaPositionsModel | null) => void;
}> = ({ market0, market1, position, setPosition }) => {
  const [phase, setPhase] = useState<Phase>();
  const [market, setMarket] = useState<MarketStateModel>();
  const [amount, setAmount] = useState<bigint>();
  const [error, setError] = useState<boolean>(false);
  const [cranked, setCranked] = useState<boolean>(false);

  useEffect(() => {
    if (position !== undefined && position !== null && position.open) {
      setPhase("summary");
    } else if (position === null || position?.open === false) {
      setPhase("pick");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [position]);

  if (phase === "summary") {
    if (!position) return <Loading />;
    return (
      <EnterTabSummary
        market={marketTernary(position, market0, market1)}
        topOff={() => {
          setPhase("amount");
          setMarket(marketTernary(position, market0, market1));
        }}
        tapOut={() => setPhase("pick")}
        swap={() => setMarket(marketTernary(position, market1, market0))}
        {...{ market0, market1, setPosition, position }}
      />
    );
  }

  if (phase === "pick") {
    return (
      <Container progress={1} {...{ phase, position, setPhase }}>
        <EnterTabPickPhase
          {...{
            market0,
            market1,
            setMarket,
            error,
            closeError: () => setError(false),
            cranked,
            closeCranked: () => setCranked(false),
            nextPhase: () => setPhase("amount"),
          }}
        />
      </Container>
    );
  }

  if (phase === "amount") {
    if (!market) throw new Error("Market is undefined in amount phase");
    return (
      <Container progress={2} {...{ phase, position, setPhase }}>
        <EnterTabAmountPhase {...{ market, setAmount, nextPhase: () => setPhase("lock") }} />
      </Container>
    );
  }

  if (phase === "lock") {
    if (!market || amount === undefined)
      throw new Error("Market or amount is undefined in lock phase");
    return (
      <Container progress={3} {...{ phase, position, setPhase }}>
        <EnterTabLockPhase
          {...{
            market,
            market0,
            market1,
            amount,
            errorOut: () => {
              setPhase("pick");
              setError(true);
            },
            setCranked: () => {
              setPhase("pick");
              setCranked(true);
            },
            position,
            setPosition,
          }}
        />
      </Container>
    );
  }
  return <Loading />;
};
