module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};

    use emojicoin_dot_fun::hex_codes;

    const MAX_SYMBOL_LENGTH: u8 = 10;
    const MAX_NAME_LENGTH: u8 = 32;

    #[resource_group = ObjectGroup]
    struct Market has key {
        market_id: address,
        market_address: address,
        emoji_bytes: vector<u8>,
        extend_ref: ExtendRef,
    }

    #[resource_group = ObjectGroup]
    struct Registry has key {
        registry_address: address,
        supported_emojis: SmartTable<vector<u8>, u8>,
        markets_by_emoji_bytes: SmartTable<vector<u8>, address>,
        markets_by_market_id: SmartTable<u64, address>,
        extend_ref: ExtendRef,
    }

    struct RegistryAddress has key {
        registry_address: address,
    }

    fun init_module(emojicoin_dot_fun: &signer) {
        let constructor_ref = object::create_object(@emojicoin_dot_fun);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let registry_signer = object::generate_signer(&constructor_ref);
        let registry_address = object::address_from_constructor_ref(&constructor_ref);
        move_to(emojicoin_dot_fun, RegistryAddress { registry_address });
        let registry = Registry {
            registry_address,
            supported_emojis: smart_table::new(),
            markets_by_emoji_bytes: smart_table::new(),
            markets_by_market_id: smart_table::new(),
            extend_ref,
        };

        smart_table::add_all(
            &mut registry.supported_emojis,
            hex_codes::get_all(),
            hex_codes::get_zeroed_vector(),
        );
        move_to(&registry_signer, registry);
    }

    #[view]
    public fun is_supported_emoji(hex_bytes: vector<u8>): bool acquires Registry, RegistryAddress {
        let registry_address = borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address;
        let registry = borrow_global<Registry>(registry_address);
        smart_table::contains(&registry.supported_emojis, hex_bytes)
    }

    #[test_only] use std::aptos_account;
    #[test_only] use std::vector;

    #[test]
    fun test_all_supported_emojis_under_10_bytes() {
        let all_supported_emojis = hex_codes::get_all();
        vector::for_each(all_supported_emojis, |bytes| {
            assert!(vector::length(&bytes) <= (MAX_SYMBOL_LENGTH as u64), 0);
        });
    }

    #[test(deployer = @emojicoin_dot_fun)]
    fun test_supported_emoji_happy_path(deployer: &signer) acquires Registry, RegistryAddress {
        aptos_account::create_account(@emojicoin_dot_fun);
        init_module(deployer);
        let various_emojis = vector<vector<u8>> [
            x"f09f868e",              // Ab button blood type, 1F18E.
            x"f09fa6bbf09f8fbe",      // Ear with hearing aid medium dark skin tone, 1F9BB 1F3FE.
            x"f09f87a7f09f87b9",      // Flag bhutan, 1F1E7 1F1F9.
            x"f09f9190f09f8fbe",      // Open hands medium dark skin tone, 1F450 1F3FE.
            x"f09fa4b0f09f8fbc",      // Pregnant woman medium light skin tone, 1F930 1F3FC.
            x"f09f9faa",              // Purple square, 1F7EA.
            x"f09f91abf09f8fbe",      // Woman and man holding hands medium dark skin tone, 1F46B 1F3FE.
            x"f09f91a9f09f8fbe",      // Woman medium dark skin tone, 1F469 1F3FE.
            x"f09fa795f09f8fbd",      // Woman with headscarf medium skin tone, 1F9D5 1F3FD.
            x"f09fa490",              // Zipper mouth face, 1F910.
        ];
        vector::for_each(various_emojis, |bytes| {
            assert!(is_supported_emoji(bytes), 0);
        });

        // Test unsupported emojis.
        assert!(!is_supported_emoji(x"0000"), 0);
        assert!(!is_supported_emoji(x"fe0f"), 0);
        assert!(!is_supported_emoji(x"1234"), 0);
        assert!(!is_supported_emoji(x"f0fabcdefabcdeff0f"), 0);
        assert!(!is_supported_emoji(x"f0beefcafef0"), 0);
        assert!(!is_supported_emoji(x"f09f9982e2808de28694"), 0); // Minimally qualified "head shaking horizontally".
    }
}
