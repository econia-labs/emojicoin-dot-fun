export type MessageContainerProps = {
  index: number;
  message: MessageType;
  shouldAnimateAsInsertion?: boolean;
  alignLeft: boolean;
  backgroundColor?: string;
};

type MessageType = {
  sender: string;
  text: string;
  label: string;
  version: bigint;
};
