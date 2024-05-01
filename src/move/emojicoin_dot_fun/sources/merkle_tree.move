module emojicoin_dot_fun::merkle_tree {
    use aptos_std::smart_table::{Self, SmartTable};
	use std::vector;
	use std::error;
	use std::hash;

    const ROOT_HASH: vector<u8> = x"8eebeda90c5abeeede1a064a777a9cea6b79397749623eaf24a984ecb296d467";

	/// Invalid value for sibling position flag byte.
	const EINVALID_FLAG: u64 = 0;
	/// The root hash length isn't 32 bytes.
	const EINCORRECT_HASH_LENGTH: u64 = 1;
    /// The emoji bytes passed in are invalid.
    const EINVALID_EMOJI: u64 = 2;

    struct VerifiedAuxiliaryEmojis has key {
        inner: SmartTable<vector<u8>, u8>,
    }

    public(friend) fun init(deployer: &signer) {
        let root_hash_length = vector::length(&ROOT_HASH);
        let hash_length = vector::length(&hash::sha3_256(b""));
		assert!(root_hash_length == hash_length, EINCORRECT_HASH_LENGTH);
        move_to(
            deployer,
            VerifiedAuxiliaryEmojis {
                inner: SmartTable::new(),
            },
        );
    }

    public(friend) fun verify_auxiliary_emoji(
        aux_emoji_bytes: vector<u8>,
        proof: vector<vector<u8>>
    ) acquires VerifiedAuxiliaryEmojis {
        if (smart_table::contains(&aux_emoji_bytes)) {
            return;
        } else {
            // Verify that the leaf hash created from the aux_emoji_bytes exists in the merkle tree.
            let leaf_hash = hash::sha3_256(aux_emoji_bytes);
            let verified = verify_proof(leaf_hash, proof);
            assert!(verified, EINVALID_EMOJI);

            // If the leaf node hash exists, we add it to the verified auxiliary emojis table
            // to avoid having to re-verify it in the future.
            let aux_emojis_mut = borrow_global_mut<VerifiedAuxiliaryEmojis>(@emojicoin_dot_fun);
            smart_table::add(&mut aux_emojis_mut, aux_emoji_bytes, 0);
        };
    }

	/// Note that the last byte of each hash in the proof vector represents a boolean value for
    /// the sibling hash being on the left or the right side when hashed.
	/// Thus each vector<u8> inside the `proof: vector<vector<u8>>` will consist of 32 + 1 bytes.
	inline fun verify_proof(
		leaf_hash: vector<u8>,     // The leaf hash that we are verifying exists in the tree.
		proof: vector<vector<u8>>, // A vector of sibling hashes, computed off-chain.
	): bool {
		let current_hash = leaf_hash;
		vector::for_each(proof, |sibling_hash| {
			let flag = vector::remove(&mut sibling_hash, 0);
			// 0 means the sibling_hash is on left, 1 means the sibling_hash is on the right.
			if (flag == 0) {
				current_hash = hash::sha3_256(get_concatenation(sibling_hash, current_hash));
			} else if (flag == 1) {
				current_hash = hash::sha3_256(get_concatenation(current_hash, sibling_hash));
			} else {
				abort error::invalid_argument(EINVALID_FLAG)
			};
		});

		(current_hash == ROOT_HASH)
	}

	/// Helper to return the concat'd vector
	inline fun get_concatenation(
		v1: vector<u8>,
		v2: vector<u8>,
	): vector<u8> {
		vector::append(&mut v1, v2);
		v1
	}

	#[test]
	fun merkle_test_multiple_proofs() {
		// when leaf == '64', this is our proof. generated with typescript
		let leaf_hash = x"c043633486d685a8b0cd8014f79a12cb83055ff16f2076f2c22f2f31e5828d0f";
		assert!(leaf_hash == hash::sha3_256(b"64"), 8);
		let proof = vector<vector<u8>> [
			x"006d598c87bf4b41cb477b024473acab547d3dad60589c5162ade957155730571f",
			x"007e4f092eb7263c393b154706bfca582da43ab954c18eb157f439b6551013858f",
			x"00bbfa5a8e621958d73442dee8cd0d32fbcc9ee4ea0c34d152f0bfd6f2d13f807e",
			x"00dd6dbb4e822bc717b9a1eba9175af967fed85131293d7d93cc7a93ec26e82bed",
			x"00a98994829b5e9d1eda998ee53ea1dcfe946313e26198f8b2ae8df4cddcefef26",
			x"0032779c0c1da1bb75a128c4392e9353f1f89bd465fb5bb614d906302e11db4791",
		];
		assert!(verify_proof(leaf_hash, proof), 9);
	}
}