"use client";

import {
  MarketMetadataByMarketAddress,
  MarketProperties,
  SetMarketProperties,
} from "@/contract-apis";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  type ChangeEventHandler,
  type MouseEventHandler,
  useEffect,
  useMemo,
  useState,
} from "react";

const PLACEHOLDERS = new Map([
  ["Discord", "https://discord.gg/..."],
  ["Motto", "The best shoe market ever!"],
  ["Telegram", "https://t.me/..."],
  ["Website", "https://..."],
  ["X profile", "https://x.com/..."],
]);

const DEFAULT_FIELDS = new Map(Array.from(PLACEHOLDERS.entries().map(([key, _]) => [key, ""])));

const BUTTON_CLASS_NAME = "text-white px-4 border-ec-blue border-solid border-[3px] rounded-xl";
const INPUT_CLASS_NAME =
  "text-white px-4 border-ec-blue border-solid border-[3px] rounded-xl bg-black outline-none";

const FormEntry = ({
  value,
  onChange,
  placeholder,
  name,
  onClick,
  buttonText,
  className,
  disabled = false,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  placeholder: string;
  name: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <div className={`mx-auto relative`}>
    <div className="max-w-[300px] text-white">{name}</div>
    <input
      tabIndex={1}
      className={`${INPUT_CLASS_NAME} w-[300px] ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    ></input>
    {buttonText && (
      <button
        className={`${BUTTON_CLASS_NAME} absolute right-[-60px] ${disabled ? "!border-dark-gray" : ""}`}
        onClick={onClick}
        tabIndex={2}
        disabled={disabled}
      >
        {buttonText}
      </button>
    )}
  </div>
);

const MetadataPage = () => {
  const [fields, setFields] = useState<Map<string, string>>(DEFAULT_FIELDS);
  const [marketAddress, setMarketAddress] = useState<string>("");
  const [addFieldName, setAddFieldName] = useState<string>("");
  const [pasted, setPasted] = useState(false);

  const { account, aptos, submit } = useAptos();

  const isMarketAddressValid = useMemo(
    () => AccountAddress.isValid({ input: marketAddress }).valid,
    [marketAddress]
  );

  const { data: marketExists } = useQuery({
    queryKey: ["metadata-market-exists", marketAddress],
    queryFn: async () => {
      if (!isMarketAddressValid) {
        return null;
      }
      try {
        const market = await MarketMetadataByMarketAddress.view({
          aptos,
          marketAddress,
        });
        return market.vec.length !== 0;
      } catch (e) {
        console.error(
          "Failed to call the emojicoin_dot_fun::MarketMetadataByMarketAddress view function.",
          e
        );
        return false;
      }
    },
  });

  const marketAddressBorderColor = useMemo(() => {
    switch (marketExists) {
      case true:
        return "border-green";
      case false:
        return "border-pink";
      case null:
      case undefined:
        return "border-ec-blue";
    }
  }, [marketExists]);

  const isSubmitEnabled = useMemo(
    () => account !== null && marketExists === true,
    [account, marketExists]
  );

  // Update fields on market address change
  useEffect(() => {
    // Don't fetch market properties if market address is not valid.
    if (!isMarketAddressValid) {
      return;
    }
    // Don't fetch market properties if user has pasted.
    if (pasted) {
      return;
    }
    MarketProperties.submit({
      aptos,
      market: marketAddress,
    })
      .then((r) => r.vec.at(0) ?? null)
      .then((r) => {
        if (r) {
          const newFields = new Map();
          PLACEHOLDERS.entries().forEach(([fieldName, _]) => {
            newFields.set(fieldName, "");
          });
          (r as { data: { key: string; value: string }[] }).data.forEach(({ key, value }) => {
            newFields.set(key, value);
          });
          setFields(newFields);
        }
      })
      .catch((e) => console.error("Could not get existing market metadata.", e));
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [marketAddress]);

  return (
    <div className="w-[100%] h-[100%] flex flex-col gap-[10px] text-xl place-content-center">
      <FormEntry
        name="Market address"
        value={marketAddress}
        placeholder="0xabc..."
        onChange={(e) => setMarketAddress(e.target.value)}
        className={marketAddressBorderColor}
      ></FormEntry>
      {Array.from(fields.entries())
        // We sort special (those which have a placeholder) fields first, then alphabetically.
        .toSorted((a, b) => {
          if (PLACEHOLDERS.has(a[0]) && !PLACEHOLDERS.has(b[0])) {
            return -1;
          }
          if (PLACEHOLDERS.has(b[0]) && !PLACEHOLDERS.has(a[0])) {
            return 1;
          }
          return a[0].localeCompare(b[0]);
        })
        .map(([key, value]) => (
          <FormEntry
            key={key}
            name={key}
            value={value}
            placeholder={PLACEHOLDERS.get(key) ?? key}
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
          if (addFieldName === "") {
            return;
          }
          setFields(new Map(fields.set(addFieldName, "")));
          setAddFieldName("");
        }}
        disabled={addFieldName === ""}
        buttonText="+"
      ></FormEntry>
      <div>{/* For spacing. */}</div>
      <div className="mx-auto w-[300px] grid grid-cols-2 grid-rows-2 gap-[10px]">
        <button
          tabIndex={3}
          className={`${BUTTON_CLASS_NAME}`}
          onClick={() => {
            const data = {
              marketAddress,
              fields: Array.from(fields.entries().filter(([_, value]) => value !== "")),
            };
            navigator.clipboard.writeText(JSON.stringify(data));
          }}
        >
          Copy
        </button>
        <button
          tabIndex={3}
          className={`${BUTTON_CLASS_NAME}`}
          onClick={() => {
            navigator.clipboard
              .readText()
              .then((r) => {
                const data = JSON.parse(r);
                setFields(new Map(data.fields));
                setMarketAddress(data.marketAddress);
                setPasted(true);
              })
              .catch(console.warn);
          }}
        >
          Paste
        </button>
        <button
          tabIndex={3}
          className={`${BUTTON_CLASS_NAME} ${!isSubmitEnabled ? "!border-dark-gray" : ""} col-span-full`}
          onClick={async () => {
            if (!isSubmitEnabled) {
              return;
            }
            const filledFields = fields.entries().filter(([_, value]) => value !== "");
            const builderLambda = () =>
              SetMarketProperties.builder({
                aptosConfig: aptos.config,
                admin: account!.address,
                market: marketAddress,
                keys: Array.from(filledFields.map(([key, _]) => key)),
                values: Array.from(filledFields.map(([_, value]) => value)),
              });
            const res = await submit(builderLambda);
            if (!res || res.error) {
              console.error(res);
            }
          }}
          disabled={!isSubmitEnabled}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default MetadataPage;
