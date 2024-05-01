import { MerkleTree } from 'merkletreejs';
import { sha3_256 } from '@noble/hashes/sha3';
import { Hex, HexInput } from '@aptos-labs/ts-sdk';
import auxiliaryEmojis from './auxiliary-emojis.json';

const merkleTree = new MerkleTree(
    auxiliaryEmojis.map(e => sha3_256(e)),
    sha3_256,
);

export function getMerkleRoot(): string {
    return Hex.fromHexString(merkleTree.getHexRoot()).toStringWithoutPrefix();
}

export function getProof(emoji: HexInput): string[] {
    const emojiHash = sha3_256(emoji);
    const proof = merkleTree.getProof(Buffer.from(emojiHash));
    return proof.map(p => Hex.fromHexInput(new Uint8Array([
        ...p.data,
        p.position === 'left' ? 0 : 1,
    ])).toStringWithoutPrefix());
}

console.log(getMerkleRoot());

const proof1 = getProof('f09fabb1f09f8fbfe2808df09fabb2f09f8fbf');
const proof2 = getProof('f09fabb1f09f8fbfe2808df09fabb2f09f8fbc');
console.log(proof1);
console.log(proof2);
