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
                inner: smart_table::new(),
            },
        );
    }

    #[view]
    public fun is_verified_auxiliary_emoji(
        aux_emoji_bytes: vector<u8>,
        proof: vector<vector<u8>>,
    ): bool acquires VerifiedAuxiliaryEmojis {
        let aux_emojis = borrow_global<VerifiedAuxiliaryEmojis>(@emojicoin_dot_fun);
        let in_smart_table = smart_table::contains(&aux_emojis.inner, aux_emoji_bytes);
        let verified = verify_proof(hash::sha3_256(aux_emoji_bytes), proof);

        in_smart_table && verified
    }

    public(friend) fun verify_auxiliary_emoji(
        aux_emoji_bytes: vector<u8>,
        proof: vector<vector<u8>>
    ) acquires VerifiedAuxiliaryEmojis {
        let aux_emojis = borrow_global<VerifiedAuxiliaryEmojis>(@emojicoin_dot_fun);
        if (smart_table::contains(&aux_emojis.inner, aux_emoji_bytes)) {
            return
        } else {
            // Verify that the leaf hash created from the aux_emoji_bytes exists in the merkle tree.
            let leaf_hash = hash::sha3_256(aux_emoji_bytes);
            let verified = verify_proof(leaf_hash, proof);
            assert!(verified, EINVALID_EMOJI);

            // If the leaf node hash exists, we add it to the verified auxiliary emojis table
            // to avoid having to re-verify it in the future.
            let aux_emojis_mut = borrow_global_mut<VerifiedAuxiliaryEmojis>(@emojicoin_dot_fun);
            smart_table::add(&mut aux_emojis_mut.inner, aux_emoji_bytes, 0);
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
			let flag = vector::pop_back(&mut sibling_hash);
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

	#[test(deployer = @emojicoin_dot_fun)]
	fun merkle_test_multiple_proofs(deployer: &signer) acquires VerifiedAuxiliaryEmojis {
        init(deployer);
        let emoji_bytes = x"f09f91a8f09f8fbee2808de29a96efb88f";
        let proof = vector<vector<u8>> [
            x"f4f844f62e7778cf4e5644c2732e0fd8085b7cfcb285c4473ed10e36fc75cdb400",
            x"5245744a3f15e70798d4149fe3238d0a5153ce5f7c77ec9507cb0068a19df60901",
            x"003670e1a9ee4399cf2a77a91cb3d635a3bc3544f082fa2457b9854ed6c6f1fc01",
            x"d5285ea2e4cb3168be294e517f563cf8a90cd6d5af18e27a9338a96ed3af0c2a01",
            x"1e4d442c76679f52a3cc77d65cbbe3a767a57179cca7b5b47d864f2aff89eebb00",
            x"a8286de38f58fc2a9bc3f71084c6f91f79ad2b04a47e189868a67f676341d07c01",
            x"4cd478af45f9db90f8881fcf82cefa69e0bd0aede76238e36df1c582e14259a301",
            x"262d339169bb6d7824980511d9f1b0002d54034576e36aeb68302d767c37841301",
            x"278ecefe6e52a9d5e0cacd8c9dc8213537bbfc2865a9ce4e030c7ef6c4f4c97600",
            x"63892e12d7d2540dba74a083195dc83d09248c90502bab5c2a2f7e409a9a0c9b01",
            x"008e5ce576be6277a67b1373d40ec5245c1da99b6bb8abf6ebee68f0a9412cda01",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09fa78ef09f8fbbe2808de29982efb88fe2808de29ea1efb88f";
        let proof = vector<vector<u8>> [
            x"0eb2dbbb000dab1f65db770b3b934475886c83685b9b727fef671522c765ab8800",
            x"8f7fd011413556ae27af2a5606ba7b9022ddc2a3fd03b875c866a53bdc934cee01",
            x"44ccec3a3f2f566b5f9fb7b556640342f3a25026e4de78187e6362867895d44701",
            x"7a30bfa5db2791a57fa37613ace559bd29698462ee605478518c7599c418cca200",
            x"f37953092e9e7dc02c7487153f7c7cd7041886a041f5fc91f74ede60ebc6629301",
            x"d5042599c9e48dd10c4915ad09e27b6829c2e91df793c8db255cb7d68700b2a800",
            x"3b26f2581d2cef2eb3e3f121cd56afc3afa6c03011bb0460b2ef60ac07e78d0d01",
            x"4d4b26955bb7ac8a700c965be50ce0d56eb1bc345c50f5acdd686ab7eaf4545701",
            x"c55fd68fd5d137dcc6df3742a15d9f110e5e31ca13be3ef2f24a7593e4dfa75d01",
            x"6a9fb269f97a7ca1b9aeb67677cd4a5006bb34523070b765cab0fbbfbeac820500",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09f91a8f09f8fbee2808df09f8fab";
        let proof = vector<vector<u8>> [
            x"b0653c3bdffd8dffccb60ffdd8806e8ac814061fd734ca0d4751859a5125dc7600",
            x"51a6149ed0cfcf6ea1e3e0341b0bf0b91c65b79bb5afcc3c08521c9af9e79c2300",
            x"5bc2d9d4aa782fa16e8e71a215c6379b24ea5f98e8553bf325991f987062807801",
            x"22ef8d420314ecfed6d26999aa89d0db5ae6aba41949cd5295559ac2844d202401",
            x"130f62a962ca3397d503baadb8e7cd1656b24f4fc311a57fc3e6181baaa4fcfc01",
            x"f5a865890baaa38cb6fe9a223da299da68347297a0e550e5ada0f0704a35fd8000",
            x"4cd478af45f9db90f8881fcf82cefa69e0bd0aede76238e36df1c582e14259a301",
            x"262d339169bb6d7824980511d9f1b0002d54034576e36aeb68302d767c37841301",
            x"278ecefe6e52a9d5e0cacd8c9dc8213537bbfc2865a9ce4e030c7ef6c4f4c97600",
            x"63892e12d7d2540dba74a083195dc83d09248c90502bab5c2a2f7e409a9a0c9b01",
            x"008e5ce576be6277a67b1373d40ec5245c1da99b6bb8abf6ebee68f0a9412cda01",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09f91a8f09f8fbde2808df09f92bb";
        let proof = vector<vector<u8>> [
            x"cc08866b1ec2e939072fe6252ca39d5cf20df720d8d0a4d0442c1bf4ff61533501",
            x"82ed02061ca0e76a06ecd94fa6a6badcf695ac7cbdf911a967f9417fb87e054d01",
            x"ff75505fb991bf779d56da24d7555171f50d7ad686032edc3c07a3f069708a2700",
            x"c7f53dc51afb9c972ac061e2dadf50646abfea88f947881d44deecb34bcc6a2d00",
            x"f88f637eb3cc102161909967fb885662c4703b9f27b68867996a0a2397150ba500",
            x"7fc44e9847001be074899d5f0e99496fd629e264aa3fec198d416cbdab9b595000",
            x"ce5d104876c95ab759a122bf8711f507e3b843d7d187a850e693c720a6150a1200",
            x"19570232d19de18e6d408afb2ff33127551c462642cdcc4254c8f92629be887200",
            x"84f0fdf31aee48dc997b06789e3339c6561376fc76968acaf5cf151e38d778cb01",
            x"63892e12d7d2540dba74a083195dc83d09248c90502bab5c2a2f7e409a9a0c9b01",
            x"008e5ce576be6277a67b1373d40ec5245c1da99b6bb8abf6ebee68f0a9412cda01",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09fa791f09f8fbee2808df09fa49de2808df09fa791f09f8fbc";
        let proof = vector<vector<u8>> [
            x"11ed60ccf3fa25b233f2f87df1da47777fbacb3bc46689f37575e6d2166802ab01",
            x"57034c8eecc64ee55bd7c4777759ff67ee069cbbe6252f885497c601e146170e00",
            x"35196c340d3c0c9a22238390263e9c6f45b101d9bb9456ca069c2fa6fdbe892d01",
            x"75a71ef080fa44ec838f700b9cae7f8bd6fa54eb3e8034fc913a86c732e9e7a601",
            x"7ca012bbb3b7b4f2ef3aebfe440538083d2005cc5002ae61c74c79eb3ae799b801",
            x"7a07a3e0f1b48b9ad25d4cb3e2762d13fe1d169552095aeacb9bcafaea85765901",
            x"1e3a7e17ace80f6d1518a1c9e816d224f4d26624faddbaa65f8ca37ab04734b201",
            x"480932b921ea52a181a530ae41566e9831548c3a608a4ac4338d87518490b95a01",
            x"8a3fb98032ec163375b4272e67a51631077d2c6b2d4dc6154eef328842b94d0000",
            x"6a9fb269f97a7ca1b9aeb67677cd4a5006bb34523070b765cab0fbbfbeac820500",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09fa791f09f8fbee2808df09fa6b1";
        let proof = vector<vector<u8>> [
            x"4f7ae18cac4aac302e11b35a06e62170c44cce9b337e4667df61feecbe9a68d100",
            x"8ff73867fc13129cfd57b2a5daac7ffb9c9ce3d3e3108bd972ef33469ac3fdf701",
            x"80e6805a0b2d7ca0507bfe504bc709660c3a5cf0f47add9a12707a408dd957cd01",
            x"b225675d49e77f53773eb4811c2d58e5409a5716adc1462bd80f925cb7b5ef3200",
            x"7ca012bbb3b7b4f2ef3aebfe440538083d2005cc5002ae61c74c79eb3ae799b801",
            x"7a07a3e0f1b48b9ad25d4cb3e2762d13fe1d169552095aeacb9bcafaea85765901",
            x"1e3a7e17ace80f6d1518a1c9e816d224f4d26624faddbaa65f8ca37ab04734b201",
            x"480932b921ea52a181a530ae41566e9831548c3a608a4ac4338d87518490b95a01",
            x"8a3fb98032ec163375b4272e67a51631077d2c6b2d4dc6154eef328842b94d0000",
            x"6a9fb269f97a7ca1b9aeb67677cd4a5006bb34523070b765cab0fbbfbeac820500",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09f91a9f09f8fbde2808de29a95efb88f";
        let proof = vector<vector<u8>> [
            x"70c8fc58148e0c547f4da4c311aa2d88f44e3c24b4bb1f6dcd775c35cdc456ec00",
            x"a1327cd42cce2d2da8a49b613306fdd92b123b0406da7a4368aac1827d225a9601",
            x"481835c34df55a879009b2c54f804590a5ad54b6e8625094c39599165f7e753901",
            x"c4d9ed66780cdeb9e7f397c2a1df67dbfb04fbafc400e60ea40a2e724ef901de00",
            x"b3fd470a63f7ddc2f249b3439f077151d58855f291ff0d0c06c645753abbb24800",
            x"bc63b64499e62675f8a106b55093d8a6e8eb1bf4d013e7d5e0776e5744d0bfd700",
            x"968968bc2e6b95912f7f5e6368c2ea8963fa43b98feb19ca6be764f8a1761f1e00",
            x"f6bc8c34a005f9ad9b2034c8eadc8229f56a416e86e891f381a574dcf8cccf2600",
            x"278ecefe6e52a9d5e0cacd8c9dc8213537bbfc2865a9ce4e030c7ef6c4f4c97600",
            x"63892e12d7d2540dba74a083195dc83d09248c90502bab5c2a2f7e409a9a0c9b01",
            x"008e5ce576be6277a67b1373d40ec5245c1da99b6bb8abf6ebee68f0a9412cda01",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09fa6b8f09f8fbde2808de29980efb88f";
        let proof = vector<vector<u8>> [
            x"3b9c2bdcde1a59542937eab9c10b0c7eb6d7d82d633f615ce276e527781e608100",
            x"88ccbb15d949964286f93cf51fec35b1e4ed7e1d4e450e09cf90b0a59e71a86800",
            x"79b2603940de452354819bcfd17c2c9de789dfb397c80f79fddf62a31cc8833f01",
            x"43cc4c96dec7010927a921e3a612864445e697395f9a50ddf2ffc917e3353df001",
            x"81e5190bf199361410528f9daae0b988077d2d588fce0b06aa2bee13d18b5c4201",
            x"700ef3b6ff5c8e816c61dcf6bf286b674af68b6a3205e026652446678b0b183401",
            x"3b26f2581d2cef2eb3e3f121cd56afc3afa6c03011bb0460b2ef60ac07e78d0d01",
            x"4d4b26955bb7ac8a700c965be50ce0d56eb1bc345c50f5acdd686ab7eaf4545701",
            x"c55fd68fd5d137dcc6df3742a15d9f110e5e31ca13be3ef2f24a7593e4dfa75d01",
            x"6a9fb269f97a7ca1b9aeb67677cd4a5006bb34523070b765cab0fbbfbeac820500",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);

        let emoji_bytes = x"f09f91a9f09f8fbbe2808df09fa49de2808df09f91a9f09f8fbd";
        let proof = vector<vector<u8>> [
            x"a68ddda6e9e6570751ca42b7274b82d0e9092275b46b8406011f966a3d965fd500",
            x"3bb18c779b810a1a3a7d11bd4952aa6c075aa68ba3c90173e251b087ba91189f01",
            x"5f851c68c19292e1085329e4d75a6be723243d25834b674a194f1384c3dd850200",
            x"940c7d9da6bba5ccd8d0b2d36a8a3db9e2cdc314cd048b8129e4557c64480ff501",
            x"5308b7318d434a1c6b6f09359e437249ef32e8810f97edc0676ac0a75a8dd6e400",
            x"8f505554f1bac332431242556b456f4a8bcea147dcf83996f9a11e20aeba456900",
            x"f1c02f135af84ad94fd082c047a7d3e499a1d426c74d394612b02d337c5a6e5801",
            x"f6bc8c34a005f9ad9b2034c8eadc8229f56a416e86e891f381a574dcf8cccf2600",
            x"278ecefe6e52a9d5e0cacd8c9dc8213537bbfc2865a9ce4e030c7ef6c4f4c97600",
            x"63892e12d7d2540dba74a083195dc83d09248c90502bab5c2a2f7e409a9a0c9b01",
            x"008e5ce576be6277a67b1373d40ec5245c1da99b6bb8abf6ebee68f0a9412cda01",
        ];
        assert!(is_verified_auxiliary_emoji(emoji_bytes, proof), 0);
	}
}
