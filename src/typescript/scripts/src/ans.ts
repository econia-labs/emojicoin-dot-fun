import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const main = async () => {
  const mainnet = new Aptos(
    new AptosConfig({
      network: Network.MAINNET,
    })
  );
  await mainnet.ans.getName({ name: "matt" }).then(console.log);
  await mainnet.ans.getDomainSubdomains({ domain: "matt" }).then(console.log);
  await mainnet.ans.getDomainSubdomains({ domain: "petra" }).then(console.log);
};

main();
