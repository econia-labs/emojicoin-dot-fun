import { useMemo, useState } from "react";
import { useInterval } from "react-use";
import darkTheme from "theme/dark";

const CountdownNumber = ({ n }: { n: string }) => (
  <div
    style={{
      border: `1px solid ${darkTheme.colors.darkGray}`,
      borderRadius: "5px",
      background: "black",
      width: "1.7ch",
      textAlign: "center",
      margin: ".1em",
      paddingLeft: ".05em",
      color: darkTheme.colors.econiaBlue,
    }}
  >
    {n}
  </div>
);

export const Countdown = ({ startTime, duration }: { startTime: Date; duration: bigint }) => {
  const getRemaining = () =>
    Number(duration) - (new Date().getTime() / 1000 - startTime.getTime() / 1000);
  const [remaining, setRemaining] = useState<number>(getRemaining());
  useInterval(() => {
    setRemaining(getRemaining());
  }, 1000);

  const seconds = useMemo(
    () =>
      Math.max(Math.floor(remaining) % 60, 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );
  const minutes = useMemo(
    () =>
      Math.max(Math.floor(remaining / 60) % 60, 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );
  const hours = useMemo(
    () =>
      Math.max(Math.floor(remaining / 60 / 60), 0)
        .toString()
        .padStart(2, "0"),
    [remaining]
  );

  return (
    <div className="text-light-gray flex flex-row pixel-clock w-min">
      <CountdownNumber n={hours.split("")[0]} />
      <CountdownNumber n={hours.split("")[1]} />
      <div className="my-auto w-[1ch] text-center">:</div>
      <CountdownNumber n={minutes.split("")[0]} />
      <CountdownNumber n={minutes.split("")[1]} />
      <div className="my-auto w-[1ch] text-center">:</div>
      <CountdownNumber n={seconds.split("")[0]} />
      <CountdownNumber n={seconds.split("")[1]} />
    </div>
  );
};
