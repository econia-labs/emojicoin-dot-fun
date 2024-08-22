export const OuterConnectText = ({
  side,
  connected,
  mobile,
  geoblocked,
}: {
  side: "left" | "right";
  connected: boolean;
  mobile?: boolean;
  geoblocked: boolean;
}) => {
  if (!geoblocked && connected) {
    if (mobile && side === "left") {
      return null;
    }
    return (
      <div className={side === "left" ? "pr-2.5" : "pl-2.5"}>
        <span className="text-base flex mt-2.5 animate-flicker drop-shadow-voltage">{"⚡"}</span>
      </div>
    );
  } else {
    if (mobile) {
      return null;
    } else {
      return (
        <div className={side === "left" ? "pr-2.5" : "pl-2.5"}>{side === "left" ? "{" : "}"}</div>
      );
    }
  }
};

export default OuterConnectText;
