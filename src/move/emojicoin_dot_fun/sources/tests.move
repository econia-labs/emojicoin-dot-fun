#[test_only] module emojicoin_dot_fun::tests {

    use aptos_framework::account::{create_signer_for_test as get_signer};
    use aptos_framework::aptos_account;
    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::string_utils;
    use black_cat_market::coin_factory::{
        Emojicoin as BlackCatEmojicoin,
        EmojicoinLP as BlackCatEmojicoinLP,
    };
    use black_heart_market::coin_factory::{
        Emojicoin as BlackHeartEmojicoin,
        EmojicoinLP as BlackHeartEmojicoinLP,
    };
    use coin_factory::coin_factory::{
        Emojicoin as CoinFactoryEmojicoin,
        EmojicoinLP as CoinFactoryEmojicoinLP,
    };
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Chat,
        Self,
        MarketMetadata,
        assert_valid_coin_types_test_only as assert_valid_coin_types,
        chat,
        cpamm_simple_swap_output_amount_test_only as cpamm_simple_swap_output_amount,
        exists_lp_coin_capabilities,
        get_BASE_REAL_CEILING,
        get_BASE_VIRTUAL_CEILING,
        get_BASE_VIRTUAL_FLOOR,
        get_COIN_FACTORY_AS_BYTES,
        get_EMOJICOIN_STRUCT_NAME,
        get_EMOJICOIN_LP_NAME_SUFFIX,
        get_EMOJICOIN_LP_STRUCT_NAME,
        get_EMOJICOIN_LP_SYMBOL_PREFIX,
        get_EMOJICOIN_NAME_SUFFIX,
        get_MAX_CHAT_MESSAGE_LENGTH,
        get_MAX_SYMBOL_LENGTH,
        get_MARKET_REGISTRATION_FEE,
        get_MICROSECONDS_PER_SECOND,
        get_PERIOD_1M,
        get_PERIOD_5M,
        get_PERIOD_15M,
        get_PERIOD_30M,
        get_PERIOD_1H,
        get_PERIOD_4H,
        get_PERIOD_1D,
        get_QUOTE_REAL_CEILING,
        get_QUOTE_VIRTUAL_CEILING,
        get_QUOTE_VIRTUAL_FLOOR,
        get_concatenation_test_only as get_concatenation,
        verified_symbol_emoji_bytes,
        init_module_test_only as init_module,
        is_a_supported_chat_emoji,
        is_a_supported_symbol_emoji,
        market_metadata_by_emoji_bytes,
        pack_reserves,
        register_market,
        register_market_without_publish,
        swap,
        unpack_market_metadata,
        unpack_chat,
        valid_coin_types_test_only as valid_coin_types,
    };
    use emojicoin_dot_fun::hex_codes::{
        get_metadata_bytes_test_only as get_metadata_bytes,
        get_split_module_bytes_test_only as get_split_module_bytes,
        get_coin_symbol_emojis_test_only as get_coin_symbol_emojis,
        get_publish_code_test_only as get_publish_code,
    };
    use emojicoin_dot_fun::test_acquisitions::{
        mint_aptos_coin_to,
    };
    use yellow_heart_market::coin_factory::{
        Emojicoin as YellowHeartEmojicoin,
        EmojicoinLP as YellowHeartEmojicoinLP,
        BadType,
    };
    use std::bcs;
    use std::option;
    use std::string::{Self, String, utf8};
    use std::type_info;
    use std::vector;

    struct TestChat has copy, drop, store {
        market_metadata: TestMarketMetadata,
        emit_time: u64,
        emit_market_nonce: u64,
        user: address,
        message: String,
        user_emojicoin_balance: u64,
        circulating_supply: u64,
        balance_as_fraction_of_circulating_supply_q64: u128,
    }

    struct TestMarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>,
    }

    // Test market emoji bytes.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";

    const SWAP_BUY: bool = false;
    const SWAP_SELL: bool = true;

    const USER: address = @0xaaaaa;
    const INTEGRATOR: address = @0xbbbbb;

    public fun address_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): address {
        let (_, market_address, _) = unpack_market_metadata(
            metadata_for_registered_market_by_emoji_bytes(emoji_bytes)
        );
        market_address
    }

    public fun assert_chat(
        test_chat: TestChat,
        chat: Chat,
    ) {
        let (
            market_metadata,
            emit_time,
            emit_market_nonce,
            user,
            message,
            user_emojicoin_balance,
            circulating_supply,
            balance_as_fraction_of_circulating_supply_q64,
        ) = unpack_chat(chat);
        assert_market_metadata(test_chat.market_metadata, market_metadata);
        assert!(emit_time == test_chat.emit_time, 0);
        assert!(emit_market_nonce == test_chat.emit_market_nonce, 0);
        assert!(user == test_chat.user, 0);
        assert!(message == test_chat.message, 0);
        assert!(user_emojicoin_balance == test_chat.user_emojicoin_balance, 0);
        assert!(circulating_supply == test_chat.circulating_supply, 0);
        assert!(
            balance_as_fraction_of_circulating_supply_q64 ==
                test_chat.balance_as_fraction_of_circulating_supply_q64,
            0
        );
    }

    public fun assert_market_metadata(
        test_metadata: TestMarketMetadata,
        metadata: MarketMetadata,
    ) {
        let (market_id, market_address, emoji_bytes) = unpack_market_metadata(metadata);
        assert!(market_id == test_metadata.market_id, 0);
        assert!(market_address == test_metadata.market_address, 0);
        assert!(emoji_bytes == test_metadata.emoji_bytes, 0);
    }

    public fun assert_test_market_address(
        emoji_bytes: vector<vector<u8>>,
        hard_coded_address: address,
        publish_code: bool,
    ) {
        mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        if (publish_code) { // Only one publication operation allowed per transaction.
            register_market(&get_signer(USER), emoji_bytes, INTEGRATOR);
        } else {
            register_market_without_publish(&get_signer(USER), emoji_bytes, INTEGRATOR);
        };
        let derived_market_address = address_for_registered_market_by_emoji_bytes(emoji_bytes);
        assert!(derived_market_address == hard_coded_address, 0);
    }

    public fun assert_coin_name_and_symbol<Emojicoin, EmojicoinLP>(
        emoji_bytes: vector<vector<u8>>,
        expected_lp_symbol: vector<u8>,
    ) {
        init_market_and_coins_via_swap<Emojicoin, EmojicoinLP>(emoji_bytes);

        // Test emojicoin name and symbol.
        let symbol = utf8(verified_symbol_emoji_bytes(emoji_bytes));
        let name = get_concatenation(symbol, utf8(get_EMOJICOIN_NAME_SUFFIX()));
        assert!(coin::symbol<Emojicoin>() == symbol, 0);
        assert!(coin::name<Emojicoin>() == name, 0);

        // Test LP coin name and symbols.
        let market_id = market_id_for_registered_market_by_emoji_bytes(emoji_bytes);
        let lp_symbol = get_concatenation(
            utf8(get_EMOJICOIN_LP_SYMBOL_PREFIX()),
            string_utils::to_string(&market_id),
        );
        assert!(utf8(expected_lp_symbol) == lp_symbol, 0);
        let lp_name = get_concatenation(symbol, utf8(get_EMOJICOIN_LP_NAME_SUFFIX()));
        assert!(coin::symbol<EmojicoinLP>() == lp_symbol, 0);
        assert!(coin::name<EmojicoinLP>() == lp_name, 0);
    }

    public fun init_package() {
        aptos_account::create_account(@emojicoin_dot_fun);
        timestamp::set_time_has_started_for_testing(&get_signer(@aptos_framework));
        init_module(&get_signer(@emojicoin_dot_fun));
    }

    public fun init_market(
        emoji_bytes: vector<vector<u8>>,
    ) {
        mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        register_market_without_publish(&get_signer(USER), emoji_bytes, INTEGRATOR);
    }

    public fun init_market_and_coins_via_swap<Emojicoin, EmojicoinLP>(
        emoji_bytes: vector<vector<u8>>,
    ) {
        init_market(emoji_bytes);
        let input_amount = 100;
        let integrator_fee_rate_bps = 0;
        swap<Emojicoin, EmojicoinLP>(
            address_for_registered_market_by_emoji_bytes(emoji_bytes),
            &get_signer(USER),
            input_amount,
            SWAP_BUY,
            INTEGRATOR,
            integrator_fee_rate_bps,
        );
    }

    public fun market_id_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): u64 {
        let (market_id, _, _) = unpack_market_metadata(
            metadata_for_registered_market_by_emoji_bytes(emoji_bytes)
        );
        market_id
    }

    public fun metadata_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): MarketMetadata {
         option::destroy_some(
            market_metadata_by_emoji_bytes(verified_symbol_emoji_bytes(emoji_bytes))
        )
    }

    #[test] fun all_supported_emojis_under_10_bytes() {
        let max_symbol_length = (get_MAX_SYMBOL_LENGTH() as u64);
        vector::for_each(get_coin_symbol_emojis(), |bytes| {
            let emoji_as_string = utf8(bytes);
            assert!(string::length(&emoji_as_string) <= max_symbol_length, 0);
        });
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_INVALID_COIN_TYPES,
        location = emojicoin_dot_fun
    )] fun assert_valid_coin_types_bad_types() {
        init_package();
        init_market(vector[YELLOW_HEART]);
        assert_valid_coin_types<BadType, BadType>(@yellow_heart_market);
    }

    #[test] fun chat_complex_emoji_sequences() {
        init_package();
        let emojis = vector[
            x"f09fa791e2808df09f9a80", // Astronaut.
            x"f09fa6b8f09f8fbee2808de29982efb88f", // Man superhero: medium-dark skin tone.
        ];

        // Verify neither supplemental chat emoji is supported before first market is registered.
        assert!(!vector::all(&emojis, |emoji_ref| { is_a_supported_chat_emoji(*emoji_ref) }), 0);

        // Register a market, verify both emojis supported in chat.
        init_market(vector[BLACK_CAT]);
        assert!(vector::all(&emojis, |emoji_ref| { is_a_supported_chat_emoji(*emoji_ref) }), 0);
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            emojis,
            vector[1, 0],
            @black_cat_market,
        );

        // Chat again with a longer message.
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f98b6", // Cat face.
                x"f09f98b7", // Cat face with tears of joy.
                x"f09f98b8", // Cat face with wry smile.
                x"f09f9088e2808de2ac9b", // Black cat.
                x"f09f9294", // Broken heart.
            ],
            vector[ 3, 0, 2, 2, 1, 4 ],
            @black_cat_market,
        );

        // Post a max length chat message.
        let emoji_indices_sequence = vector[];
        for (i in 0..get_MAX_CHAT_MESSAGE_LENGTH()) {
            vector::push_back(&mut emoji_indices_sequence, 0);
        };
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f9088e2808de2ac9b", // Black cat.
            ],
            emoji_indices_sequence,
            @black_cat_market,
        );

        // Assert the emitted chat events.
        let events_emitted = event::emitted_events<Chat>();
        let market_metadata = TestMarketMetadata {
            market_id: 1,
            market_address: @black_cat_market,
            emoji_bytes: BLACK_CAT,
        };
        assert_chat(
            TestChat {
                market_metadata,
                emit_time: 0,
                emit_market_nonce: 2,
                user: USER,
                message: utf8(x"f09fa6b8f09f8fbee2808de29982efb88ff09fa791e2808df09f9a80"),
                user_emojicoin_balance: 0,
                circulating_supply: 0,
                balance_as_fraction_of_circulating_supply_q64: 0,
            },
            *vector::borrow(&events_emitted, 0),
        );
        assert_chat(
            TestChat {
                market_metadata,
                emit_time: 0,
                emit_market_nonce: 3,
                user: USER,
                message: utf8(x"f09f9088e2808de2ac9bf09f98b6f09f98b8f09f98b8f09f98b7f09f9294"),
                user_emojicoin_balance: 0,
                circulating_supply: 0,
                balance_as_fraction_of_circulating_supply_q64: 0,
            },
            *vector::borrow(&events_emitted, 1),
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_NOT_SUPPORTED_CHAT_EMOJI,
        location = emojicoin_dot_fun
    )] fun chat_message_invalid_emoji() {
        init_package();
        init_market(vector[BLACK_CAT]);

        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f98b7", // Cat face with tears of joy.
                x"f09f", // Invalid emoji.
            ],
            vector[ 0, 1],
            @black_cat_market,
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_CHAT_MESSAGE_TOO_LONG,
        location = emojicoin_dot_fun
    )] fun chat_message_too_long() {
        init_package();
        init_market(vector[BLACK_CAT]);

        // Try to send a chat message that is one emoji too long.
        let emojis = vector[
            x"f09f8dba", // Beer mug.
        ];
        let emoji_indices_sequence = vector[];
        for (i in 0..(get_MAX_CHAT_MESSAGE_LENGTH() + 1)) {
            vector::push_back(&mut emoji_indices_sequence, 0);
        };
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            emojis,
            emoji_indices_sequence,
            @black_cat_market,
        );
    }

    #[test] fun concatenation() {
        let base = utf8(b"base");
        let additional = utf8(b" additional");
        let concatenated = get_concatenation(base, additional);
        assert!(concatenated == utf8(b"base additional"), 0);
        // Ensure the base string was not mutated.
        assert!(base == utf8(b"base"), 0);
    }

    #[test] fun coin_factory_type_info() {
        let module_name = get_COIN_FACTORY_AS_BYTES();
        let emojicoin_struct = get_EMOJICOIN_STRUCT_NAME();
        let emojicoin_lp_struct = get_EMOJICOIN_LP_STRUCT_NAME();

        let emojicoin_type_info = type_info::type_of<CoinFactoryEmojicoin>();
        let lp_type_info = type_info::type_of<CoinFactoryEmojicoinLP>();

        assert!(@coin_factory == type_info::account_address(&emojicoin_type_info), 0);
        assert!(@coin_factory == type_info::account_address(&lp_type_info), 0);
        assert!(module_name == type_info::module_name(&emojicoin_type_info), 0);
        assert!(module_name == type_info::module_name(&lp_type_info), 0);
        assert!(emojicoin_struct == type_info::struct_name(&emojicoin_type_info), 0);
        assert!(emojicoin_lp_struct == type_info::struct_name(&lp_type_info), 0);
    }

    #[test] fun coin_names_and_symbols() {
        init_package();

        assert_coin_name_and_symbol<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            vector[BLACK_CAT],
            b"LP-1",
        );
        assert_coin_name_and_symbol<BlackHeartEmojicoin, BlackHeartEmojicoinLP>(
            vector[BLACK_HEART],
            b"LP-2",
        );
        assert_coin_name_and_symbol<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(
            vector[YELLOW_HEART],
            b"LP-3",
        );
    }

    #[test] fun cpamm_simple_swap_output_amount_buy_sell_all() {
        // Buy all base from start of bonding curve.
        let reserves = pack_reserves(get_BASE_VIRTUAL_CEILING(), get_QUOTE_VIRTUAL_FLOOR());
        let output = cpamm_simple_swap_output_amount(get_QUOTE_REAL_CEILING(), false, reserves);
        assert!(output == get_BASE_REAL_CEILING(), 0);
        // Sell all base to a bonding curve that is theoretically complete but has not transitioned.
        reserves = pack_reserves(get_BASE_VIRTUAL_FLOOR(), get_QUOTE_VIRTUAL_CEILING());
        output = cpamm_simple_swap_output_amount(get_BASE_REAL_CEILING(), true, reserves);
        assert!(output == get_QUOTE_REAL_CEILING(), 0);
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_SWAP_DIVIDE_BY_ZERO,
        location = emojicoin_dot_fun
    )] fun cpamm_simple_swap_output_amount_divide_by_zero() {
        cpamm_simple_swap_output_amount(0, true, pack_reserves(0, 16));
    }

    // Verify hard-coded test market addresses, derived from `@emojicoin_dot_fun` dev address.
    #[test] fun derived_test_market_addresses() {
        init_package();
        assert_test_market_address(vector[BLACK_CAT], @black_cat_market, true);
        assert_test_market_address(vector[BLACK_HEART], @black_heart_market, false);
        assert_test_market_address(vector[YELLOW_HEART], @yellow_heart_market, false);
    }

    #[test] fun get_publish_code_expected() {
        let market_address = @0xabcdef0123456789;
        let expected_metadata_bytecode = get_metadata_bytes();

        // Manually construct expected module bytecode.
        let split_module_bytes = get_split_module_bytes();
        let expected_module_bytecode = *vector::borrow(&split_module_bytes, 0);
        vector::append(&mut expected_module_bytecode, bcs::to_bytes(&market_address));
        vector::append(&mut expected_module_bytecode, *vector::borrow(&split_module_bytes, 1));

        // Compare expected vs actual bytecode.
        let (metadata_bytecode, module_bytecode) = get_publish_code(market_address);
        assert!(metadata_bytecode == expected_metadata_bytecode, 0);
        assert!(module_bytecode == expected_module_bytecode, 0);
    }

    #[test] fun period_times() {
        let ms_per_s = get_MICROSECONDS_PER_SECOND();
        assert!(get_PERIOD_1M() == 60 * ms_per_s, 0);
        assert!(get_PERIOD_5M() == 5 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_15M() == 15 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_30M() == 30 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_1H() == 60 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_4H() == 4 * 60 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_1D() == 24 * 60 * 60 * ms_per_s, 0);
    }

    #[test] fun register_market_with_compound_emoji_sequence() {
        init_package();
        let emojis = vector[
            x"e29aa1",           // High voltage.
            x"f09f96a5efb88f",   // Desktop computer.
        ];
        let concatenated_bytes = verified_symbol_emoji_bytes(emojis);

        // Verify market is not already registered, register, then verify is registered.
        assert!(market_metadata_by_emoji_bytes(concatenated_bytes) == option::none(), 0);
        init_market(emojis);
        let market_metadata =
            option::destroy_some(market_metadata_by_emoji_bytes(concatenated_bytes));
        let (_, _, market_metadata_byes) = unpack_market_metadata(market_metadata);
        assert!(market_metadata_byes == concatenated_bytes, 0);
    }

    #[test] fun supported_symbol_emojis() {
        init_package();
        let various_emojis = vector<vector<u8>> [
            x"f09f868e",         // AB button blood type, 1F18E.
            x"f09fa6bbf09f8fbe", // Ear with hearing aid medium dark skin tone, 1F9BB 1F3FE.
            x"f09f87a7f09f87b9", // Flag Bhutan, 1F1E7 1F1F9.
            x"f09f9190f09f8fbe", // Open hands medium dark skin tone, 1F450 1F3FE.
            x"f09fa4b0f09f8fbc", // Pregnant woman medium light skin tone, 1F930 1F3FC.
            x"f09f9faa",         // Purple square, 1F7EA.
            x"f09f91abf09f8fbe", // Woman and man holding hands medium dark skin tone, 1F46B 1F3FE.
            x"f09f91a9f09f8fbe", // Woman medium dark skin tone, 1F469 1F3FE.
            x"f09fa795f09f8fbd", // Woman with headscarf medium skin tone, 1F9D5 1F3FD.
            x"f09fa490",         // Zipper mouth face, 1F910.
        ];
        vector::for_each(various_emojis, |bytes| {
            assert!(is_a_supported_symbol_emoji(bytes), 0);
        });

        // Test unsupported emojis.
        assert!(!is_a_supported_symbol_emoji(x"0000"), 0);
        assert!(!is_a_supported_symbol_emoji(x"fe0f"), 0);
        assert!(!is_a_supported_symbol_emoji(x"1234"), 0);
        assert!(!is_a_supported_symbol_emoji(x"f0fabcdefabcdeff0f"), 0);
        assert!(!is_a_supported_symbol_emoji(x"f0f00dcafef0"), 0);
        // Minimally qualified "head shaking horizontally".
        assert!(!is_a_supported_symbol_emoji(x"f09f9982e2808de28694"), 0);

        // Verify a supported emoji, add invalid data to it, then verify it is no longer allowed.
        assert!(is_a_supported_symbol_emoji(x"e29d97"), 0);
        assert!(!is_a_supported_symbol_emoji(x"e29d97ff"), 0);
        assert!(!is_a_supported_symbol_emoji(x"ffe29d97"), 0);
    }

    #[test] fun swap_initializes_coin_capabilities() {
        init_package();
        let emoji_bytes = vector[YELLOW_HEART];
        init_market_and_coins_via_swap<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(emoji_bytes);
        assert!(
            exists_lp_coin_capabilities<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(
                @yellow_heart_market
            ),
            0,
        );
    }

    #[test] fun valid_coin_types_all_invalid() {
        // Duplicate types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoin>(@emojicoin_dot_fun), 0);
        // Duplicate LP types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoinLP, BlackCatEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad Emojicoin type should be invalid.
        assert!(!valid_coin_types<BadType, BlackCatEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad EmojicoinLP type should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BadType>(@emojicoin_dot_fun), 0);
        // Backwards coin types that are otherwise valid should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoinLP, BlackCatEmojicoin>(@emojicoin_dot_fun), 0);
        // A market address that doesn't match the types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoinLP>(@0xc1de), 0);
    }

    #[test] fun valid_coin_types_all_valid() {
        assert!(
            valid_coin_types<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(@yellow_heart_market) &&
            valid_coin_types<BlackHeartEmojicoin, BlackHeartEmojicoinLP>(@black_heart_market) &&
            valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market),
            0
        );
    }
}
