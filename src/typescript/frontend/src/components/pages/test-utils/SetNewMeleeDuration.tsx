"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { cn } from "lib/utils/class-name";
import { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { successfulTransactionToast } from "@/components/wallet/toasts";
import { EmojicoinArena } from "@/move-modules";
import { isNumberInConstruction } from "@/sdk/utils";

import { getLocalPublisher } from "./local-publisher";

const MICROSECONDS_PER_MINUTE = 60 * 1000 * 1000;

export const SetMeleeDurationForm = ({ className }: React.HTMLAttributes<HTMLDivElement>) => {
  const [duration, setDuration] = useState("");
  const { aptos } = useAptos();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value);

  const handleClick = () => {
    const dur = Number.parseFloat(duration);
    const asMicroseconds = dur * MICROSECONDS_PER_MINUTE;
    const floored = Math.floor(asMicroseconds);
    const durationAsMicroseconds = BigInt(floored);
    EmojicoinArena.SetNextMeleeDuration.submit({
      aptosConfig: aptos.config,
      emojicoinArena: getLocalPublisher(),
      duration: durationAsMicroseconds,
    }).then((res) => {
      if (res.success) {
        successfulTransactionToast(res, { name: Network.LOCAL });
      } else {
        toast.error("Fail.");
      }
    });
  };

  return (
    <div
      className={cn("flex flex-col w-full max-w-48 m-auto space-x-2 gap-1 font-forma", className)}
    >
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-white font-forma" htmlFor="duration">
          {"Duration (minutes)"}
        </Label>
        <Input
          id="duration"
          value={duration}
          className="text-lighter-gray"
          type="text"
          placeholder="in minutes"
          onChange={handleChange}
        />
      </div>
      <Button
        className="m-auto"
        disabled={!isNumberInConstruction(duration)}
        onClick={handleClick}
        type="submit"
      >
        {"set next melee duration"}
      </Button>
    </div>
  );
};
