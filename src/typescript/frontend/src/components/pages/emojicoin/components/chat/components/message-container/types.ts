export type MessageContainerProps = {
  index: number;
  message: MessageType;
  shouldAnimateAsInsertion?: boolean;
};

export type MessageType = {
  sender: string;
  text: string;
  senderRank: string;
  version: number;
};
