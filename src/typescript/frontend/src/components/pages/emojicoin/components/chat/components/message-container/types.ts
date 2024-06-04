export type MessageContainerProps = {
  message: MessageType;
};

export type MessageType = {
  sender: string;
  text: string;
  senderRank: string;
  version: number;
};
