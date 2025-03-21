module favorites::emojicoin_dot_fun_favorites {
    use aptos_framework::event;
    use aptos_framework::ordered_map::{Self, OrderedMap};
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
    /// Market is already a favorite.
    const E_ALREADY_FAVORITE: u64 = 2;
    /// Market is not a favorite.
    const E_NOT_FAVORITE: u64 = 3;

    struct Nil {}
    has copy, drop, store;

    struct FavoriteData {
        markets: OrderedMap<address, Nil>
    }
    has drop, key;

    #[view]
    public fun view_favorites(user: address): vector<address> acquires FavoriteData {
        if (exists<FavoriteData>(user)) {
            let favorites = borrow_global_mut<FavoriteData>(user);
            favorites.markets.keys()
        } else {
            vector::empty()
        }
    }

    /// Add the market to the user's favorite markets.
    ///
    /// Aborts if:
    ///
    /// - The market does not exist.
    /// - The market is already a favorite.
    public entry fun add_favorite(user: &signer, market: address) acquires FavoriteData {
        assert!(
            option::is_some(&emojicoin_dot_fun::market_metadata_by_market_address(market)),
            E_MARKET_NOT_FOUND
        );
        let user_address = signer::address_of(user);
        if (exists<FavoriteData>(user_address)) {
            let favorites = borrow_global_mut<FavoriteData>(user_address);
            assert!(
                !favorites.markets.contains(&market),
                E_ALREADY_FAVORITE
            );
            favorites.markets.add(market, Nil {});
        } else {
            let map = ordered_map::new();
            map.add(market, Nil {});
            let favorites = FavoriteData { markets: map };
            move_to<FavoriteData>(user, favorites);
        };
        event::emit(Favorite { user: user_address, market, is_favorite: true });
    }

    /// Remove the market from the user's favorite markets.
    ///
    /// Aborts if:
    ///
    /// - The market is not a favorite.
    public entry fun remove_favorite(user: &signer, market: address) acquires FavoriteData {
        let user_address = signer::address_of(user);
        assert!(
            exists<FavoriteData>(user_address),
            E_NOT_FAVORITE
        );
        let favorites = borrow_global_mut<FavoriteData>(user_address);
        assert!(
            favorites.markets.contains(&market),
            E_NOT_FAVORITE
        );
        favorites.markets.remove(&market);
        if (favorites.markets.length() == 0) {
            move_from<FavoriteData>(user_address);
        };
        event::emit(Favorite { user: user_address, market, is_favorite: false });
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

        add_favorite(&account_1_signer, market_1_address);
        add_favorite(&account_2_signer, market_2_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
        assert!(account_2_favorites.length() == 1);
        assert!(account_2_favorites.contains(&market_2_address));

        remove_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 1);

        remove_favorite(&account_2_signer, market_2_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 0);
    }

    #[test]
    fun test_add_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        add_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test]
    fun test_set_multiple_favorites() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        add_favorite(&account_1_signer, market_1_address);
        add_favorite(&account_1_signer, market_2_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 2);
        assert!(account_1_favorites.contains(&market_1_address));
        assert!(account_1_favorites.contains(&market_2_address));
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_add_favorite_nonexistent_market() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let nonexistent_market_address = @0x1234;

        add_favorite(&account_1_signer, nonexistent_market_address);
    }

    #[test]
    fun test_remove_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        add_favorite(&account_1_signer, market_1_address);
        add_favorite(&account_1_signer, market_2_address);
        remove_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_2_address));
    }

    #[test, expected_failure(abort_code = E_NOT_FAVORITE)]
    fun test_remove_non_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);
        let market_2_address = get_market_address(MARKET_2);

        add_favorite(&account_1_signer, market_1_address);
        remove_favorite(&account_1_signer, market_2_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_address));
    }

    #[test, expected_failure(abort_code = E_NOT_FAVORITE)]
    fun test_remove_no_favorites() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        remove_favorite(&account_1_signer, market_1_address);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 0);
    }

    #[test, expected_failure(abort_code = E_ALREADY_FAVORITE)]
    fun test_add_favorite_twice() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_address = get_market_address(MARKET_1);

        add_favorite(&account_1_signer, market_1_address);
        add_favorite(&account_1_signer, market_1_address);
    }
}
