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
        symbol_bytes: vector<u8>,
        is_favorite: bool
    }

    /// Market not found.
    const E_MARKET_NOT_FOUND: u64 = 1;
    /// Market is already a favorite.
    const E_ALREADY_FAVORITE: u64 = 2;
    /// Market is not a favorite.
    const E_NOT_FAVORITE: u64 = 3;
    /// User already has the maximum number of favorites.
    const E_USER_HAS_MAX_NUMBER_OF_FAVORITES: u64 = 4;

    const MAX_NUM_FAVORITES: u64 = 25;

    struct Nil {}
    has copy, drop, store;

    struct FavoriteData {
        markets: OrderedMap<vector<u8>, Nil>
    }
    has drop, key;

    #[view]
    public fun view_favorites(user: address): vector<vector<u8>> acquires FavoriteData {
        if (exists<FavoriteData>(user)) {
            let favorites = borrow_global_mut<FavoriteData>(user);
            favorites.markets.keys()
        } else {
            vector::empty()
        }
    }

    /// Add a market by its symbol bytes to the user's favorite markets.
    ///
    /// Aborts if:
    ///
    /// - The market does not exist.
    /// - The market is already a favorite.
    /// - The user already has the max number of favorites.
    public entry fun add_favorite(user: &signer, symbol_bytes: vector<u8>) acquires FavoriteData {
        assert!(
            option::is_some(
                &emojicoin_dot_fun::market_metadata_by_emoji_bytes(symbol_bytes)
            ),
            E_MARKET_NOT_FOUND
        );
        let user_address = signer::address_of(user);
        if (exists<FavoriteData>(user_address)) {
            let favorites = borrow_global_mut<FavoriteData>(user_address);
            assert!(
                favorites.markets.length() < MAX_NUM_FAVORITES,
                E_USER_HAS_MAX_NUMBER_OF_FAVORITES
            );
            assert!(
                !favorites.markets.contains(&symbol_bytes),
                E_ALREADY_FAVORITE
            );
            favorites.markets.add(symbol_bytes, Nil {});
        } else {
            let map = ordered_map::new();
            map.add(symbol_bytes, Nil {});
            let favorites = FavoriteData { markets: map };
            move_to<FavoriteData>(user, favorites);
        };
        event::emit(Favorite { user: user_address, symbol_bytes, is_favorite: true });
    }

    /// Remove  a market by its symbol bytes from the user's favorite markets.
    ///
    /// Aborts if:
    ///
    /// - The market is not a favorite.
    public entry fun remove_favorite(
        user: &signer, symbol_bytes: vector<u8>
    ) acquires FavoriteData {
        let user_address = signer::address_of(user);
        assert!(
            exists<FavoriteData>(user_address),
            E_NOT_FAVORITE
        );
        let favorites = borrow_global_mut<FavoriteData>(user_address);
        assert!(
            favorites.markets.contains(&symbol_bytes),
            E_NOT_FAVORITE
        );
        favorites.markets.remove(&symbol_bytes);
        if (favorites.markets.length() == 0) {
            move_from<FavoriteData>(user_address);
        };
        event::emit(Favorite { user: user_address, symbol_bytes, is_favorite: false });
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
    use emojicoin_dot_fun::hex_codes::{
        get_coin_symbol_emojis_test_only as get_coin_symbol_emojis
    };

    #[test_only]
    const E_SIMPLE_MAP_ALREADY_EXISTS: u64 = 65537;
    #[test_only]
    const E_SIMPLE_MAP_NOT_FOUND: u64 = 65538;

    #[test_only]
    fun init_emojicoin() {
        emojicoin_dot_fun::tests::init_package();
        emojicoin_dot_fun::tests::init_market(MARKET_1);
        emojicoin_dot_fun::tests::init_market(MARKET_2);

        let emojis = get_coin_symbol_emojis().slice(0, MAX_NUM_FAVORITES + 1);
        for (i in 0..(MAX_NUM_FAVORITES + 1)) {
            let symbol = vector<vector<u8>>[*vector::borrow(&emojis, i)];
            emojicoin_dot_fun::tests::init_market(symbol);
        }
    }

    #[test_only]
    fun flatten_symbol_bytes(emojis: vector<vector<u8>>): vector<u8> {
        let flattened_bytes = vector[];
        for (i in 0..vector::length(&emojis)) {
            let emoji = *vector::borrow(&emojis, i);
            vector::append(&mut flattened_bytes, emoji);
        };
        flattened_bytes
    }

    #[test]
    fun test_normal_flow() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);
        let account_2_signer = get_signer(ACCOUNT_2);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);
        let market_2_bytes = flatten_symbol_bytes(MARKET_2);

        add_favorite(&account_1_signer, market_1_bytes);
        add_favorite(&account_2_signer, market_2_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_bytes));
        assert!(account_2_favorites.length() == 1);
        assert!(account_2_favorites.contains(&market_2_bytes));

        remove_favorite(&account_1_signer, market_1_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 1);

        remove_favorite(&account_2_signer, market_2_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);
        let account_2_favorites = view_favorites(ACCOUNT_2);

        assert!(account_1_favorites.length() == 0);
        assert!(account_2_favorites.length() == 0);
    }

    #[test]
    fun test_add_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);

        add_favorite(&account_1_signer, market_1_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_bytes));
    }

    #[test]
    fun test_set_multiple_favorites() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);
        let market_2_bytes = flatten_symbol_bytes(MARKET_2);

        add_favorite(&account_1_signer, market_1_bytes);
        add_favorite(&account_1_signer, market_2_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 2);
        assert!(account_1_favorites.contains(&market_1_bytes));
        assert!(account_1_favorites.contains(&market_2_bytes));
    }

    #[test, expected_failure(abort_code = E_MARKET_NOT_FOUND)]
    fun test_add_non_existent_emojis_to_favorites() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);
        add_favorite(&account_1_signer, x"ffffffffff");
    }

    #[test]
    fun test_exact_max_num_favorites() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let emojis = get_coin_symbol_emojis().slice(0, MAX_NUM_FAVORITES);
        for (i in 0..MAX_NUM_FAVORITES) {
            let emoji_bytes = *vector::borrow(&emojis, i);
            add_favorite(&account_1_signer, emoji_bytes);
        };

        let num_favorites = view_favorites(ACCOUNT_1).length();
        assert!(num_favorites == MAX_NUM_FAVORITES);
    }

    #[test, expected_failure(abort_code = E_USER_HAS_MAX_NUMBER_OF_FAVORITES)]
    fun test_exceed_max_num_favorites() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let emojis = get_coin_symbol_emojis().slice(0, MAX_NUM_FAVORITES + 1);
        for (i in 0..(MAX_NUM_FAVORITES + 1)) {
            let emoji_bytes = *vector::borrow(&emojis, i);
            add_favorite(&account_1_signer, emoji_bytes);
        }
    }

    #[test]
    fun test_remove_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);
        let market_2_bytes = flatten_symbol_bytes(MARKET_2);

        add_favorite(&account_1_signer, market_1_bytes);
        add_favorite(&account_1_signer, market_2_bytes);
        remove_favorite(&account_1_signer, market_1_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_2_bytes));
    }

    #[test, expected_failure(abort_code = E_NOT_FAVORITE)]
    fun test_remove_non_favorite() acquires FavoriteData {
        init_emojicoin();
        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);
        let market_2_bytes = flatten_symbol_bytes(MARKET_2);

        add_favorite(&account_1_signer, market_1_bytes);
        remove_favorite(&account_1_signer, market_2_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 1);
        assert!(account_1_favorites.contains(&market_1_bytes));
    }

    #[test, expected_failure(abort_code = E_NOT_FAVORITE)]
    fun test_remove_no_favorites() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);

        remove_favorite(&account_1_signer, market_1_bytes);

        let account_1_favorites = view_favorites(ACCOUNT_1);

        assert!(account_1_favorites.length() == 0);
    }

    #[test, expected_failure(abort_code = E_ALREADY_FAVORITE)]
    fun test_add_favorite_twice() acquires FavoriteData {
        init_emojicoin();

        let account_1_signer = get_signer(ACCOUNT_1);

        let market_1_bytes = flatten_symbol_bytes(MARKET_1);

        add_favorite(&account_1_signer, market_1_bytes);
        add_favorite(&account_1_signer, market_1_bytes);
    }
}
