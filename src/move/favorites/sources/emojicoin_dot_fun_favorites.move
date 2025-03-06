// cspell:word upsert
module favorites::emojicoin_dot_fun_favorites {

    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_std::smart_table::{Self, SmartTable};
    use std::option;
    use std::signer;
    use std::vector;
    use emojicoin_dot_fun::emojicoin_dot_fun;

    /// Market not found.
    const E_MARKET_NOT_FOUND: u64 = 1;

    struct Nil {}
    has copy, drop, store;

    struct FavoriteData {
        market: address,
        favorites: u128
    }
    has copy, drop, store;

    struct Registry has key {
        users: SmartTable<address, SimpleMap<address, Nil>>
    }

    #[view]
    public fun favorites(user: address): vector<address> acquires Registry {
        let vault_ref = &Registry[@favorites];
        if (!vault_ref.users.contains(user)) {
            return vector::empty();
        };
        vault_ref.users.borrow(user).keys()
    }

    public entry fun set_favorite(user: &signer, market: address) acquires Registry {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        let user_address = signer::address_of(user);
        let vault_ref_mut = &mut Registry[@favorites];
        if (vault_ref_mut.users.contains(user_address)) {
            vault_ref_mut.users.borrow_mut(user_address).upsert(market, Nil {});
        } else {
            let map = simple_map::new();
            map.add(market, Nil {});
            vault_ref_mut.users.add(user_address, map);
        }
    }

    public entry fun unset_favorite(user: &signer, market: address) acquires Registry {
        let user_address = signer::address_of(user);
        let vault_ref_mut = &mut Registry[@favorites];
        let v = vault_ref_mut.users.borrow_mut(user_address);
        v.remove(&market);
        if (v.length() == 0) {
            vault_ref_mut.users.remove(user_address);
        }
    }

    fun init_module(favorites: &signer) {
        move_to(
            favorites,
            Registry { users: smart_table::new() }
        );
    }

    #[test_only]
    use aptos_framework::account::{create_signer_for_test as get_signer};

    #[test_only]
    const ACCOUNT_1: address = @0x1111;
    #[test_only]
    const ACCOUNT_2: address = @0x2222;
    #[test_only]
    const MARKET_1: vector<vector<u8>> = vector[x"f09f9088e2808de2ac9b"];
    #[test_only]
    const MARKET_2: vector<vector<u8>> = vector[x"f09f96a4"];

    #[test_only]
    const ESIMPLE_MAP_NOT_FOUND: u64 = 65538;
    #[test_only]
    const ESMART_TABLE_NOT_FOUND: u64 = 65537;

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
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);
        let account_2_signer = get_signer(ACCOUNT_2);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        set_favorite(&account_1_signer, market_1_address);
        set_favorite(&account_2_signer, market_2_address);

        let account_1_favorites = favorites(ACCOUNT_1);
        let account_2_favorites = favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
        assert!(account_2_favorites.length() == 1);
        assert!(account_2_favorites.contains(&market_2_address));

        unset_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);
        let account_2_favorites = favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 1);

        unset_favorite(&account_2_signer, market_2_address);

        let account_1_favorites = favorites(ACCOUNT_1);
        let account_2_favorites = favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 0);
    }

    #[test]
    fun test_set_favorite() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        set_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test]
    fun test_set_multiple_favorites() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        set_favorite(&account_1_signer, market_1_address);
        set_favorite(&account_1_signer, market_2_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 2);
        assert!(account_1_favorites.contains(&market_1_address));
        assert!(account_1_favorites.contains(&market_2_address));
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_set_favorite_nonexistent_market() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let unexistent_market_address = @0x1234;

        set_favorite(&account_1_signer, unexistent_market_address);
    }

    #[test]
    fun test_unset_favorite() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        set_favorite(&account_1_signer, market_1_address);
        set_favorite(&account_1_signer, market_2_address);
        unset_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_2_address));
    }

    #[test, expected_failure(
        abort_code = ESIMPLE_MAP_NOT_FOUND, location = 0x1::simple_map
    )]
    fun test_unset_non_favorite() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        set_favorite(&account_1_signer, market_1_address);
        unset_favorite(&account_1_signer, market_2_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test, expected_failure(
        abort_code = ESMART_TABLE_NOT_FOUND, location = 0x1::smart_table
    )]
    fun test_unset_no_favorites() acquires Registry {
        init_emojicoin();
        let favorites_signer = get_signer(@favorites);
        init_module(&favorites_signer);

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        unset_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 0);
    }
}
