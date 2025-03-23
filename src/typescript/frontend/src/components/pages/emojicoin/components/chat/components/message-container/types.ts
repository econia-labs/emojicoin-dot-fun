export type MessageContainerProps = {
  index: number;
  message: MessageType;
  shouldAnimateAsInsertion?: boolean;
};

type MessageType = {
  sender: string;
  text: string;
  senderRank: string;
  version: bigint;
};
