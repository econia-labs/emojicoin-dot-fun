export const HEADERS = [
  {
    width: "12.5%",
    text: "Rank",
  },
  {
    width: "12.5%",
    text: "Apt",
  },
  {
    width: "12.5%",
    text: "🖤",
  },
  {
    width: "12.5%",
    text: "Type",
  },
  {
    width: "17.5%",
    text: "Date",
  },
  {
    width: "12.5%",
    text: "Price",
  },
  {
    width: "20.5%",
    text: "Transaction",
  },
];

export const getHeaders = (emoji: string) => {
  const headers = HEADERS;
  headers[2].text = emoji;
  return headers;
};

export enum RankIcon {
  based = "🐳",
  n00b = "🐡",
  lfg = "🐬",
}

export enum RankName {
  based = "based",
  n00b = "n00b",
  lfg = "lfg",
}
