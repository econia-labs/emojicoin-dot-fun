import { MerkleTree } from "merkletreejs";
import { sha3_256 } from "@noble/hashes/sha3";
import { Hex, type HexInput } from "@aptos-labs/ts-sdk";
import auxiliaryEmojis from "./auxiliary-emojis.json";

const merkleTree = new MerkleTree(
  auxiliaryEmojis.map((e) => sha3_256(e)),
  sha3_256
);

export function getMerkleRoot(): string {
  return Hex.fromHexString(merkleTree.getHexRoot()).toStringWithoutPrefix();
}

export function getProof(emoji: HexInput): string[] {
  const emojiBytes = Hex.fromHexInput(emoji).toStringWithoutPrefix();
  const emojiHash = sha3_256(emojiBytes);
  const proof = merkleTree.getProof(Buffer.from(emojiHash));
  return proof.map((p) =>
    Hex.fromHexInput(
      new Uint8Array([...p.data, p.position === "left" ? 0 : 1])
    ).toStringWithoutPrefix()
  );
}

console.log("The generated merkle tree root created " +
    `from ${auxiliaryEmojis.length} auxiliary chat emojis is:`);
console.log([getMerkleRoot()]);

console.log("f09f91a8f09f8fbee2808de29a96efb88f");
console.log(getProof(Hex.fromHexString("f09f91a8f09f8fbee2808de29a96efb88f").toUint8Array()));
console.log("f09fa78ef09f8fbbe2808de29982efb88fe2808de29ea1efb88f");
console.log(getProof(Hex.fromHexString("f09fa78ef09f8fbbe2808de29982efb88fe2808de29ea1efb88f").toUint8Array()));
console.log("f09f91a8f09f8fbee2808df09f8fab");
console.log(getProof(Hex.fromHexString("f09f91a8f09f8fbee2808df09f8fab").toUint8Array()));
console.log("f09f91a8f09f8fbde2808df09f92bb");
console.log(getProof(Hex.fromHexString("f09f91a8f09f8fbde2808df09f92bb").toUint8Array()));
console.log("f09fa791f09f8fbee2808df09fa49de2808df09fa791f09f8fbc");
console.log(getProof(Hex.fromHexString("f09fa791f09f8fbee2808df09fa49de2808df09fa791f09f8fbc").toUint8Array()));
console.log("f09fa791f09f8fbee2808df09fa6b1");
console.log(getProof(Hex.fromHexString("f09fa791f09f8fbee2808df09fa6b1").toUint8Array()));
console.log("f09f91a9f09f8fbde2808de29a95efb88f");
console.log(getProof(Hex.fromHexString("f09f91a9f09f8fbde2808de29a95efb88f").toUint8Array()));
console.log("f09fa6b8f09f8fbde2808de29980efb88f");
console.log(getProof(Hex.fromHexString("f09fa6b8f09f8fbde2808de29980efb88f").toUint8Array()));
console.log("f09f91a9f09f8fbbe2808df09fa49de2808df09f91a9f09f8fbd");
console.log(getProof(Hex.fromHexString("f09f91a9f09f8fbbe2808df09fa49de2808df09f91a9f09f8fbd").toUint8Array()));
