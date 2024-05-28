export type MessageContainerProps = {
  message: MessageType;
};

export type MessageType = {
  user: string;
  text: string;
  userRank: string;
  fromAnotherUser: boolean;
  version: number;
};
