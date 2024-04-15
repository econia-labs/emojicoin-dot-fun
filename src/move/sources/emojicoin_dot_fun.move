module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};

    use emojicoin_dot_fun::hex_codes;

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
            vector[
                0,
                0,
            ],
        );
        move_to(&registry_signer, registry);
    }

}
