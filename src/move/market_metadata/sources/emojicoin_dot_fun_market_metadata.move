module market_metadata::emojicoin_dot_fun_market_metadata {

    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_std::smart_table::{Self, SmartTable};
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{String};
    use emojicoin_dot_fun::emojicoin_dot_fun;

    /// Signer does not correspond to admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Admin to remove address does not correspond to admin.
    const E_ADMIN_TO_REMOVE_IS_NOT_ADMIN: u64 = 1;
    /// Admin is already an admin.
    const E_ALREADY_ADMIN: u64 = 2;
    /// Admin to remove is market_metadata publisher.
    const E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER: u64 = 3;
    /// Market not found.
    const E_MARKET_NOT_FOUND: u64 = 4;
    /// The number of provided keys and values do not match.
    const E_KEYS_AND_VALUES_NOT_EQUAL_LENGTH: u64 = 5;

    struct Nil {}
    has copy, drop, store;

    struct Registry has key {
        /// Addresses of signers who can mutate the vault.
        admins: vector<address>,
        /// Table of markets to market properties.
        map: SmartTable<address, SimpleMap<String, String>>
    }

    #[view]
    public fun admins(): vector<address> acquires Registry {
        Registry[@market_metadata].admins
    }

    #[view]
    public fun market_properties(
        market: address
    ): Option<SimpleMap<String, String>> acquires Registry {
        let map = &Registry[@market_metadata].map;
        if (!map.contains(market)) {
            return option::none();
        };
        option::some(*map.borrow(market))
    }

    #[view]
    public fun market_property(market: address, property: String): Option<String> acquires Registry {
        let map = &Registry[@market_metadata].map;
        if (!map.contains(market)) {
            return option::none();
        };
        let market_properties = map.borrow(market);
        if (!market_properties.contains_key(&property)) {
            return option::none();
        };
        option::some(*market_properties.borrow(&property))
    }

    public entry fun add_admin(admin: &signer, new_admin: address) acquires Registry {
        let admins_ref_mut = &mut borrow_registry_mut_checked(admin).admins;
        assert!(!admins_ref_mut.contains(&new_admin), E_ALREADY_ADMIN);
        admins_ref_mut.push_back(new_admin);
    }

    public entry fun remove_admin(admin: &signer, admin_to_remove: address) acquires Registry {
        let admins_ref_mut = &mut borrow_registry_mut_checked(admin).admins;
        let (admin_to_remove_is_admin, admin_to_remove_index) =
            admins_ref_mut.index_of(&admin_to_remove);
        assert!(
            admin_to_remove != @market_metadata,
            E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER
        );
        assert!(admin_to_remove_is_admin, E_ADMIN_TO_REMOVE_IS_NOT_ADMIN);
        admins_ref_mut.remove(admin_to_remove_index);
    }

    /// If market metadata entry does not exist, create an empty entry. Then, add market properties,
    /// overwriting existing properties if they already exist.
    public entry fun add_market_properties(
        admin: &signer,
        market: address,
        keys: vector<String>,
        values: vector<String>
    ) acquires Registry {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        assert!(keys.length() == values.length(), E_KEYS_AND_VALUES_NOT_EQUAL_LENGTH);
        let vault_ref_mut = borrow_registry_mut_checked(admin);
        let map = &mut vault_ref_mut.map;
        if (!map.contains(market)) {
            map.add(market, simple_map::create());
        };
        let market_properties = map.borrow_mut(market);
        while (keys.length() > 0) {
            market_properties.upsert(keys.pop_back(), values.pop_back());
        }
    }

    /// Clear all properties for the given market if it has any, then set the supplied values.
    public entry fun set_market_properties(
        admin: &signer,
        market: address,
        keys: vector<String>,
        values: vector<String>
    ) acquires Registry {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        assert!(keys.length() == values.length(), E_KEYS_AND_VALUES_NOT_EQUAL_LENGTH);
        let vault_ref_mut = borrow_registry_mut_checked(admin);
        let map = &mut vault_ref_mut.map;
        if (keys.length() == 0) {
            map.remove(market);
            return;
        };
        map.upsert(market, simple_map::create());
        let market_properties = map.borrow_mut(market);
        while (keys.length() > 0) {
            market_properties.upsert(keys.pop_back(), values.pop_back());
        }
    }

    /// If the market has an entry, remove all specified keys. If the market has no entries after
    /// removing the keys, remove the market from the metadata registry.
    public entry fun remove_market_properties(
        admin: &signer, market: address, keys: vector<String>
    ) acquires Registry {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        let vault_ref_mut = borrow_registry_mut_checked(admin);
        let map = &mut vault_ref_mut.map;
        if (!map.contains(market)) {
            return;
        };
        let market_properties = map.borrow_mut(market);
        while (keys.length() > 0) {
            let key = keys.pop_back();
            if (market_properties.contains_key(&key)) {
                market_properties.remove(&key);
            };
        };
        if (market_properties.length() == 0) {
            map.remove(market);
        };
    }

    fun init_module(market_metadata: &signer) {
        move_to(
            market_metadata,
            Registry {
                admins: vector[signer::address_of(market_metadata)],
                map: smart_table::new()
            }
        );
    }

    inline fun borrow_registry_mut_checked(admin: &signer): &mut Registry {
        let vault_ref_mut = &mut Registry[@market_metadata];
        assert!(vault_ref_mut.admins.contains(&signer::address_of(admin)), E_NOT_ADMIN);
        vault_ref_mut
    }

    #[test_only]
    use aptos_framework::account::{create_signer_for_test as get_signer};
    #[test_only]
    use std::string::{utf8};

    #[test_only]
    const ADMIN: address = @0x1111;
    #[test_only]
    const NON_ADMIN: address = @0x2222;
    #[test_only]
    const MARKET_1: vector<vector<u8>> = vector[x"f09f9088e2808de2ac9b"];
    #[test_only]
    const MARKET_2: vector<vector<u8>> = vector[x"f09f96a4"];
    #[test_only]
    const PROPERTY: vector<u8> = b"foo";
    #[test_only]
    const PROPERTY_OTHER: vector<u8> = b"big foo";

    #[test_only]
    fun get_PROPERTY(): String {
        utf8(PROPERTY)
    }

    #[test_only]
    fun get_PROPERTY_OTHER(): String {
        utf8(PROPERTY_OTHER)
    }

    #[test_only]
    fun init_emojicoin() {
        emojicoin_dot_fun::tests::init_package();
        emojicoin_dot_fun::tests::init_market(MARKET_1);
        emojicoin_dot_fun::tests::init_market(MARKET_2);
    }

    #[test_only]
    fun get_market_address(emoji_bytes: vector<vector<u8>>): address {
        emojicoin_dot_fun::tests::address_for_registered_market_by_emoji_bytes(emoji_bytes)
    }

    #[test]
    fun test_normal_flow() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let market_1_value = utf8(b"bar");
        let market_2_value = utf8(b"baz");
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[market_1_value]
        );
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_2),
            vector[get_PROPERTY()],
            vector[market_2_value]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(market_1_value)
        );
        assert!(
            market_property(get_market_address(MARKET_2), get_PROPERTY())
                == option::some(market_2_value)
        );
        let market_1_value_override = utf8(b"bar baz");
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[market_1_value_override]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(market_1_value_override)
        );
        let market_1_property_other_value = utf8(b"big bar");
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()],
            vector[market_1_property_other_value]
        );
        let map = option::destroy_some(market_properties(get_market_address(MARKET_1)));
        assert!(map.contains_key(&get_PROPERTY()));
        assert!(map.contains_key(&get_PROPERTY_OTHER()));
        assert!(*map.borrow(&get_PROPERTY()) == market_1_value_override);
        assert!(*map.borrow(&get_PROPERTY_OTHER()) == market_1_property_other_value);
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(market_1_value_override)
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::some(market_1_property_other_value)
        );
    }

    #[test]
    fun test_add_multiple_properties() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY(), get_PROPERTY_OTHER()],
            vector[utf8(b"bar"), utf8(b"baz")]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(utf8(b"bar"))
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::some(utf8(b"baz"))
        );
        remove_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY(), get_PROPERTY_OTHER()]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::none()
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::none()
        );
        assert!(
            market_properties(get_market_address(MARKET_1)) == option::none()
        );
    }

    #[test]
    fun test_set_market_properties() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
        set_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()],
            vector[utf8(b"baz")]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::none()
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::some(utf8(b"baz"))
        );
    }

    #[test]
    fun test_set_market_multiple_properties() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY(), get_PROPERTY_OTHER()],
            vector[utf8(b"bar"), utf8(b"baz")]
        );
        set_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY(), get_PROPERTY_OTHER()],
            vector[utf8(b"baz"), utf8(b"bar")]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(utf8(b"baz"))
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::some(utf8(b"bar"))
        );
    }

    #[test]
    fun test_set_market_properties_empty() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY(), get_PROPERTY_OTHER()],
            vector[utf8(b"bar"), utf8(b"baz")]
        );
        set_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[],
            vector[]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::none()
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::none()
        );
        assert!(
            market_properties(get_market_address(MARKET_1)) == option::none()
        );
    }

    #[test]
    fun test_unset_property() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::none()
        );
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY_OTHER())
                == option::none()
        );
    }

    #[test]
    fun test_unset_properties() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        assert!(
            market_properties(get_market_address(MARKET_1)) == option::none()
        );
    }

    #[test]
    fun test_remove_property() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()],
            vector[utf8(b"bar")]
        );
        remove_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(utf8(b"bar"))
        );
        remove_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()]
        );
        assert!(
            market_properties(get_market_address(MARKET_1)) == option::none()
        );
    }

    #[test]
    fun test_remove_unset_property() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()]
        );
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
        remove_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY_OTHER()]
        );
        assert!(
            market_property(get_market_address(MARKET_1), get_PROPERTY())
                == option::some(utf8(b"bar"))
        );
    }

    #[test]
    fun test_add_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, NON_ADMIN);
        let expected_admins = vector[@market_metadata, NON_ADMIN];
        assert!(admins() == expected_admins);
    }

    #[test]
    fun test_remove_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, NON_ADMIN);
        remove_admin(&market_metadata_signer, NON_ADMIN);
        let expected_admins = vector[@market_metadata];
        assert!(admins() == expected_admins);
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_add_market_properties_market_not_found() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            @0x6666,
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_set_market_properties_market_not_found() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        set_market_properties(
            &market_metadata_signer,
            @0x6666,
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_remove_market_properties_market_not_found() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_market_properties(
            &market_metadata_signer,
            @0x6666,
            vector[get_PROPERTY()]
        );
    }

    #[test, expected_failure(abort_code = E_ALREADY_ADMIN)]
    fun test_add_admin_already_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, @market_metadata);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_admin_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_admin(&not_admin_signer, NON_ADMIN);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_admin_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_admin(&get_signer(NON_ADMIN), @market_metadata);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_NOT_ADMIN)]
    fun test_remove_admin_admin_to_remove_is_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_admin(&market_metadata_signer, NON_ADMIN);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER)]
    fun test_remove_admin_admin_to_remove_is_market_metadata_publisher() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let market_metadata_signer = get_signer(@market_metadata);
        remove_admin(&market_metadata_signer, @market_metadata);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_market_properties_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_market_properties(
            &not_admin_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_market_properties_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
        remove_market_properties(
            &not_admin_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()]
        );
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_set_market_properties_not_admin() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        set_market_properties(
            &not_admin_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar")]
        );
    }

    #[test, expected_failure(abort_code = E_KEYS_AND_VALUES_NOT_EQUAL_LENGTH)]
    fun test_add_market_properties_unequal_length() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar"), utf8(b"baz")]
        );
    }

    #[test, expected_failure(abort_code = E_KEYS_AND_VALUES_NOT_EQUAL_LENGTH)]
    fun test_set_market_properties_unequal_length() acquires Registry {
        init_emojicoin();
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        set_market_properties(
            &market_metadata_signer,
            get_market_address(MARKET_1),
            vector[get_PROPERTY()],
            vector[utf8(b"bar"), utf8(b"baz")]
        );
    }
}
