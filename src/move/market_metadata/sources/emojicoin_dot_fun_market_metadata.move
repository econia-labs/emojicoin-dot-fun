module market_metadata::emojicoin_dot_fun_market_metadata {

    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_std::smart_table::{Self, SmartTable};
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{String};

    /// Signer does not correspond to admin.
    const E_NOT_ADMIN: u64 = 0;
    /// Admin to remove address does not correspond to admin.
    const E_ADMIN_TO_REMOVE_IS_NOT_ADMIN: u64 = 1;
    /// Admin is already an admin.
    const E_ALREADY_ADMIN: u64 = 2;
    /// Admin to remove is market_metadata publisher.
    const E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER: u64 = 3;

    struct Nil {}
    has copy, drop, store;

    struct MetadataStore has key {
        /// Addresses of signers who can mutate the vault.
        admins: vector<address>,
        /// Table of markets to market properties.
        market_properties_table: SmartTable<address, SimpleMap<String, String>>
    }

    #[view]
    public fun admins(): vector<address> acquires MetadataStore {
        MetadataStore[@market_metadata].admins
    }

    #[view]
    public fun market_properties(
        market: address
    ): Option<SimpleMap<String, String>> acquires MetadataStore {
        let market_properties_table =
            &MetadataStore[@market_metadata].market_properties_table;
        if (market_properties_table.contains(market) == false) {
            return option::none();
        };
        option::some(*market_properties_table.borrow(market))
    }

    #[view]
    public fun market_property(
        market: address, property: String
    ): Option<String> acquires MetadataStore {
        let market_properties_table =
            &MetadataStore[@market_metadata].market_properties_table;
        if (market_properties_table.contains(market) == false) {
            return option::none();
        };
        let market_properties = market_properties_table.borrow(market);
        if (market_properties.contains_key(&property) == false) {
            return option::none();
        };
        option::some(*market_properties.borrow(&property))
    }

    public entry fun add_admin(admin: &signer, new_admin: address) acquires MetadataStore {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        assert!(!admins_ref_mut.contains(&new_admin), E_ALREADY_ADMIN);
        admins_ref_mut.push_back(new_admin);
    }

    public entry fun remove_admin(admin: &signer, admin_to_remove: address) acquires MetadataStore {
        let admins_ref_mut = &mut borrow_vault_mut_checked(admin).admins;
        let (admin_to_remove_is_admin, admin_to_remove_index) =
            admins_ref_mut.index_of(&admin_to_remove);
        assert!(
            admin_to_remove != @market_metadata,
            E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER
        );
        assert!(admin_to_remove_is_admin, E_ADMIN_TO_REMOVE_IS_NOT_ADMIN);
        admins_ref_mut.remove(admin_to_remove_index);
    }

    public entry fun add_market_property(
        admin: &signer,
        market: address,
        key: String,
        value: String
    ) acquires MetadataStore {
        let vault_ref_mut = borrow_vault_mut_checked(admin);
        let market_properties_table = &mut vault_ref_mut.market_properties_table;
        if (market_properties_table.contains(market) == false) {
            market_properties_table.add(market, simple_map::create());
        };
        let market_properties = market_properties_table.borrow_mut(market);
        market_properties.upsert(key, value);
    }

    public entry fun remove_market_property(
        admin: &signer, market: address, key: String
    ) acquires MetadataStore {
        let vault_ref_mut = borrow_vault_mut_checked(admin);
        let market_properties_table = &mut vault_ref_mut.market_properties_table;
        if (market_properties_table.contains(market) == false) {
            return;
        };
        let market_properties = market_properties_table.borrow_mut(market);
        if (market_properties.contains_key(&key) == false) {
            return;
        };
        market_properties.remove(&key);
        if (market_properties.length() == 0) {
            market_properties_table.remove(market);
        }
    }

    fun init_module(market_metadata: &signer) {
        move_to(
            market_metadata,
            MetadataStore {
                admins: vector[signer::address_of(market_metadata)],
                market_properties_table: smart_table::new()
            }
        );
    }

    inline fun borrow_vault_mut_checked(admin: &signer): &mut MetadataStore {
        let vault_ref_mut = &mut MetadataStore[@market_metadata];
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
    const MARKET_1: address = @0x3333;
    #[test_only]
    const MARKET_2: address = @0x4444;
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

    #[test]
    fun test_normal_flow() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let market_1_value = utf8(b"bar");
        let market_2_value = utf8(b"baz");
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            market_1_value
        );
        add_market_property(
            &market_metadata_signer,
            MARKET_2,
            get_PROPERTY(),
            market_2_value
        );
        assert!(
            market_property(MARKET_1, get_PROPERTY()) == option::some(market_1_value)
        );
        assert!(
            market_property(MARKET_2, get_PROPERTY()) == option::some(market_2_value)
        );
        let market_1_value_override = utf8(b"barbaz");
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            market_1_value_override
        );
        assert!(
            market_property(MARKET_1, get_PROPERTY())
                == option::some(market_1_value_override)
        );
        let market_1_property_other_value = utf8(b"big bar");
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY_OTHER(),
            market_1_property_other_value
        );
        let map = option::destroy_some(market_properties(MARKET_1));
        assert!(map.contains_key(&get_PROPERTY()));
        assert!(map.contains_key(&get_PROPERTY_OTHER()));
        assert!(*map.borrow(&get_PROPERTY()) == market_1_value_override);
        assert!(*map.borrow(&get_PROPERTY_OTHER()) == market_1_property_other_value);
        assert!(
            market_property(MARKET_1, get_PROPERTY())
                == option::some(market_1_value_override)
        );
        assert!(
            market_property(MARKET_1, get_PROPERTY_OTHER())
                == option::some(market_1_property_other_value)
        );
    }

    #[test]
    fun test_unset_property() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        assert!(
            market_property(MARKET_1, get_PROPERTY()) == option::none()
        );
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            utf8(b"bar")
        );
        assert!(
            market_property(MARKET_1, get_PROPERTY_OTHER()) == option::none()
        );
    }

    #[test]
    fun test_unset_properties() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        assert!(market_properties(MARKET_1) == option::none());
    }

    #[test]
    fun test_remove_property() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            utf8(b"bar")
        );
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY_OTHER(),
            utf8(b"bar")
        );
        remove_market_property(&market_metadata_signer, MARKET_1, get_PROPERTY_OTHER());
        assert!(
            market_property(MARKET_1, get_PROPERTY()) == option::some(utf8(b"bar"))
        );
        remove_market_property(&market_metadata_signer, MARKET_1, get_PROPERTY());
        assert!(market_properties(MARKET_1) == option::none());
    }

    #[test]
    fun test_remove_unset_property() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_market_property(&market_metadata_signer, MARKET_1, get_PROPERTY_OTHER());
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            utf8(b"bar")
        );
        remove_market_property(&market_metadata_signer, MARKET_1, get_PROPERTY_OTHER());
        assert!(
            market_property(MARKET_1, get_PROPERTY()) == option::some(utf8(b"bar"))
        );
    }

    #[test]
    fun test_add_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, NON_ADMIN);
        let expected_admins = vector[@market_metadata, NON_ADMIN];
        assert!(admins() == expected_admins);
    }

    #[test]
    fun test_remove_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, NON_ADMIN);
        remove_admin(&market_metadata_signer, NON_ADMIN);
        let expected_admins = vector[@market_metadata];
        assert!(admins() == expected_admins);
    }

    #[test, expected_failure(abort_code = E_ALREADY_ADMIN)]
    fun test_add_admin_already_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        add_admin(&market_metadata_signer, @market_metadata);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_admin_not_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_admin(&not_admin_signer, NON_ADMIN);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_admin_not_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_admin(&get_signer(NON_ADMIN), @market_metadata);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_NOT_ADMIN)]
    fun test_remove_admin_admin_to_remove_is_not_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        remove_admin(&market_metadata_signer, NON_ADMIN);
    }

    #[test, expected_failure(abort_code = E_ADMIN_TO_REMOVE_IS_MARKET_METADATA_PUBLISHER)]
    fun test_remove_admin_admin_to_remove_is_market_metadata_publisher() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let market_metadata_signer = get_signer(@market_metadata);
        remove_admin(&market_metadata_signer, @market_metadata);
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_add_market_property_not_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_market_property(
            &not_admin_signer,
            MARKET_1,
            get_PROPERTY(),
            utf8(b"bar")
        );
    }

    #[test, expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_remove_market_property_not_admin() acquires MetadataStore {
        let market_metadata_signer = get_signer(@market_metadata);
        init_module(&market_metadata_signer);
        let not_admin_signer = get_signer(NON_ADMIN);
        add_market_property(
            &market_metadata_signer,
            MARKET_1,
            get_PROPERTY(),
            utf8(b"bar")
        );
        remove_market_property(&not_admin_signer, MARKET_1, get_PROPERTY());
    }
}
