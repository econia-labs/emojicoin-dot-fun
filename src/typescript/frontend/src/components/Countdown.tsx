import { useMemo, useState } from "react";
import { useInterval } from "react-use";

const countdownStyles =
  "text-ec-blue border border-solid border-dark-gray rounded-[5px] w-[1.7ch] text-center m-[0.1em] pl-[0.05em]";

export const Countdown = ({ startTime, duration }: { startTime: Date; duration: bigint }) => {
  const getRemaining = () =>
    Number(duration) - (new Date().getTime() / 1000 - startTime.getTime() / 1000);
  const [remaining, setRemaining] = useState<number>(getRemaining());

  useInterval(() => {
    setRemaining(getRemaining());
  }, 1000);

  const { hours, seconds, minutes } = useMemo(() => {
    const digits = (n: number) => Math.max(n, 0).toString().padStart(2, "0");
    return {
      hours: digits(Math.floor(remaining / 60 / 60)),
      minutes: digits(Math.floor(remaining / 60) % 60),
      seconds: digits(Math.floor(remaining) % 60),
    };
  }, [remaining]);

  return (
    <div className="text-light-gray flex flex-row pixel-clock w-min">
      <span className={countdownStyles}>{hours.split("")[0]} </span>
      <span className={countdownStyles}>{hours.split("")[1]} </span>
      <span className="my-auto w-[1ch] text-center">:</span>
      <span className={countdownStyles}>{minutes.split("")[0]} </span>
      <span className={countdownStyles}>{minutes.split("")[1]} </span>
      <span className="my-auto w-[1ch] text-center">:</span>
      <span className={countdownStyles}>{seconds.split("")[0]} </span>
      <span className={countdownStyles}>{seconds.split("")[1]} </span>
    </div>
  );
};
