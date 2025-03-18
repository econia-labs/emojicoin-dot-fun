export const TimeCell = ({ date }: { date: Date }) => (
  <>
    {date.toLocaleString(undefined, {
      month: "2-digit" as const,
      day: "2-digit" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      second: "2-digit" as const,
    })}
  </>
);
