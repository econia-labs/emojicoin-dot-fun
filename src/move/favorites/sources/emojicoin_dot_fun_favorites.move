// cspell:word upsert
module favorites::emojicoin_dot_fun_favorites {
    use aptos_framework::event;
    use aptos_std::simple_map::{Self, SimpleMap};
    use std::option;
    use std::signer;
    use std::vector;
    use emojicoin_dot_fun::emojicoin_dot_fun;

    #[event]
    struct Favorite has copy, drop, store {
        user: address,
        market: address,
        is_favorite: bool
    }

    /// Market not found.
    const E_MARKET_NOT_FOUND: u64 = 1;

    struct Nil {}
    has copy, drop, store;

    struct FavoriteData {
        markets: SimpleMap<address, Nil>
    }
    has copy, drop, store, key;

    #[view]
    public fun favorites(user: address): vector<address> acquires FavoriteData {
        if (exists<FavoriteData>(user)) {
            let favorites = borrow_global_mut<FavoriteData>(user);
            favorites.markets.keys()
        } else {
            vector::empty()
        }
    }

    public entry fun set_favorite(user: &signer, market: address) acquires FavoriteData {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        let user_address = signer::address_of(user);
        event::emit(
            Favorite { user: user_address, market, is_favorite: true }
        );
        if (exists<FavoriteData>(user_address)) {
            let favorites = borrow_global_mut<FavoriteData>(user_address);
            favorites.markets.add(market, Nil {});
        } else {
            let map = simple_map::new();
            map.add(market, Nil {});
            let favorites = FavoriteData { markets: map };
            move_to<FavoriteData>(user, favorites);
        }
    }

    public entry fun unset_favorite(user: &signer, market: address) acquires FavoriteData {
        let user_address = signer::address_of(user);
        event::emit(
            Favorite { user: user_address, market, is_favorite: false }
        );
        let favorites = borrow_global_mut<FavoriteData>(user_address);
        favorites.markets.remove(&market);
        if (favorites.markets.length() == 0) {
            move_from<FavoriteData>(user_address);
        }
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
    const E_SIMPLE_MAP_ALREADY_EXISTS: u64 = 65537;
    #[test_only]
    const E_SIMPLE_MAP_NOT_FOUND: u64 = 65538;

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
    fun test_normal_flow() acquires FavoriteData {
        init_emojicoin();
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
    fun test_set_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        set_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test]
    fun test_set_multiple_favorites() acquires FavoriteData {
        init_emojicoin();
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
    fun test_set_favorite_nonexistent_market() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let nonexistent_market_address = @0x1234;

        set_favorite(&account_1_signer, nonexistent_market_address);
    }

    #[test]
    fun test_unset_favorite() acquires FavoriteData {
        init_emojicoin();
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
        abort_code = E_SIMPLE_MAP_NOT_FOUND, location = 0x1::simple_map
    )]
    fun test_unset_non_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        set_favorite(&account_1_signer, market_1_address);
        unset_favorite(&account_1_signer, market_2_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test, expected_failure(major_status = 4008, location = Self)]
    fun test_unset_no_favorites() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        unset_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 0);
    }

    #[
        test,
        expected_failure(
            abort_code = E_SIMPLE_MAP_ALREADY_EXISTS, location = 0x1::simple_map
        )
    ]
    fun test_set_favorite_twice() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        set_favorite(&account_1_signer, market_1_address);
        set_favorite(&account_1_signer, market_1_address);
    }
}
