"use client";

import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type ChangeEventHandler, type MouseEventHandler, useState } from "react";

type MetadataField = { name: string; placeholder: string };

const DEFAULT_FIELDS: [MetadataField, string][] = [
  [{ name: "CTO link", placeholder: "https://..." }, ""],
  // cspell:word moto
  [{ name: "Moto", placeholder: "The best shoe market ever!" }, ""],
];

const BUTTON_CLASSNAME = "text-white px-4 border-ec-blue border-solid border-[3px] rounded-xl";
const INPUT_CLASSNAME =
  "text-white px-4 border-ec-blue border-solid border-[3px] rounded-xl bg-black outline-none";

const FormEntry = ({
  value,
  onChange,
  placeholder,
  name,
  onClick,
  buttonText,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  placeholder: string;
  name: string;
  buttonText?: string;
}) => (
  <div className={`mx-auto relative`}>
    <div className="max-w-[300px] text-white">{name}</div>
    <input
      tabIndex={1}
      className={`${INPUT_CLASSNAME} w-[300px]`}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    ></input>
    {buttonText && (
      <button
        className={`${BUTTON_CLASSNAME} absolute right-[-60px]`}
        onClick={onClick}
        tabIndex={2}
      >
        {buttonText}
      </button>
    )}
  </div>
);

const MetadataPage = () => {
  const [fields, setFields] = useState<Map<MetadataField, string>>(new Map(DEFAULT_FIELDS));
  const [marketAddress, setMarketAddress] = useState<string>("");
  const [addFieldName, setAddFieldName] = useState<string>("");
  const { account } = useAptos();

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[10px] text-xl place-content-center">
      <FormEntry
        name="Market address"
        value={marketAddress}
        placeholder="0xabc..."
        onChange={(e) => setMarketAddress(e.target.value)}
      ></FormEntry>
      {Array.from(fields.entries()).map(([key, value]) => (
        <FormEntry
          key={key.name}
          name={key.name}
          value={value}
          placeholder={key.placeholder}
          onChange={(e) => setFields(new Map(fields.set(key, e.target.value)))}
          onClick={() => {
            fields.delete(key);
            setFields(new Map(fields));
          }}
          buttonText="-"
        ></FormEntry>
      ))}
      <FormEntry
        name="Add new field"
        value={addFieldName}
        placeholder="New field name"
        onChange={(e) => {
          setAddFieldName(e.target.value);
        }}
        onClick={() => {
          setFields(new Map(fields.set({ name: addFieldName, placeholder: addFieldName }, "")));
          setAddFieldName("");
        }}
        buttonText="+"
      ></FormEntry>
      <div>{/* For spacing. */}</div>
      <div className="mx-auto w-[300px] grid grid-cols-2 grid-rows-2 gap-[10px]">
        <button
          tabIndex={3}
          className={`${BUTTON_CLASSNAME}`}
          onClick={() => {
            const data = {
              marketAddress,
              fields: Array.from(fields.entries()),
            };
            navigator.clipboard.writeText(JSON.stringify(data));
          }}
        >
          Copy
        </button>
        <button
          tabIndex={3}
          className={`${BUTTON_CLASSNAME}`}
          onClick={() => {
            navigator.clipboard
              .readText()
              .then((r) => {
                const data = JSON.parse(r);
                setFields(new Map(data.fields));
                setMarketAddress(data.marketAddress);
              })
              .catch(console.warn);
          }}
        >
          Paste
        </button>
        <button
          tabIndex={3}
          className={`${BUTTON_CLASSNAME} ${account === null ? "!border-dark-gray" : ""} col-span-full`}
          onClick={() => {
            navigator.clipboard
              .readText()
              .then((r) => setFields(new Map(JSON.parse(r))))
              .catch(console.warn);
          }}
          disabled={account === null}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default MetadataPage;
