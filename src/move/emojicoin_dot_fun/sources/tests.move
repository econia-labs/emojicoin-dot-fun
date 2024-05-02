#[test_only] module emojicoin_dot_fun::tests {

    use aptos_framework::account;
    use aptos_framework::coin::{Self, BurnCapability, Coin, MintCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use black_cat_market::coin_factory::{
        Emojicoin as BlackCatEmojicoin,
        EmojicoinLP as BlackCatEmojicoinLP,
    };
    use black_heart_market::coin_factory::{
        Emojicoin as BlackHeartEmojicoin,
        EmojicoinLP as BlackHeartEmojicoinLP,
    };
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Self,
        cpamm_simple_swap_output_amount_test_only as cpamm_simple_swap_output_amount,
        get_BASE_REAL_CEILING,
        get_BASE_VIRTUAL_CEILING,
        get_BASE_VIRTUAL_FLOOR,
        get_MAX_SYMBOL_LENGTH,
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
        get_concatenation_test_only,
        pack_Reserves,
        init_module_test_only as init_module,
        valid_coin_types_test_only as valid_coin_types,
    };
    use emojicoin_dot_fun::hex_codes::{
        get_split_metadata_bytes_test_only as get_split_metadata_bytes,
        get_split_module_bytes_test_only as get_split_module_bytes,
        get_coin_symbol_emojis_test_only as get_coin_symbol_emojis,
        get_publish_code_test_only as get_publish_code,
    };
    use yellow_heart_market::coin_factory::{
        Emojicoin as YellowHeartEmojicoin,
        EmojicoinLP as YellowHeartEmojicoinLP,
        BadType,
    };
    use std::bcs;
    use std::string;
    use std::vector;

    struct AptosCoinCapStore has key {
        burn_cap: BurnCapability<AptosCoin>,
        mint_cap: MintCapability<AptosCoin>,
    }

    public fun init_package() {
        let framework_signer = account::create_signer_for_test(@aptos_framework);
        let emojicoin_dot_fun_signer = account::create_signer_for_test(@emojicoin_dot_fun);
        aptos_account::create_account(@emojicoin_dot_fun);
        timestamp::set_time_has_started_for_testing(&framework_signer);
        init_module(&emojicoin_dot_fun_signer);
    }

    public fun mint_aptos_coin(amount: u64): Coin<AptosCoin> acquires AptosCoinCapStore {
        if (!exists<AptosCoinCapStore>(@aptos_framework)) {
            let framework_signer = account::create_signer_for_test(@aptos_framework);
            let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&framework_signer);
            move_to(&framework_signer, AptosCoinCapStore { burn_cap, mint_cap });
        };
        coin::mint(amount, &borrow_global<AptosCoinCapStore>(@aptos_framework).mint_cap)
    }

    public fun mint_aptos_coin_to(recipient: address, amount: u64) acquires AptosCoinCapStore {
        aptos_account::deposit_coins(recipient, mint_aptos_coin(amount))
    }

    #[test] fun all_supported_emojis_under_10_bytes() {
        let max_symbol_length = (get_MAX_SYMBOL_LENGTH() as u64);
        vector::for_each(get_coin_symbol_emojis(), |bytes| {
            let emoji_as_string = string::utf8(bytes);
            assert!(string::length(&emoji_as_string) <= max_symbol_length, 0);
        });
    }

    #[test] fun concatenation() {
        let base = string::utf8(b"base");
        let additional = string::utf8(b" additional");
        let concatenated = get_concatenation_test_only(base, additional);
        assert!(concatenated == string::utf8(b"base additional"), 0);
        // Ensure the base string was not mutated.
        assert!(base == string::utf8(b"base"), 0);
    }

    #[test] fun cpamm_simple_swap_output_amount_buy_sell_all() {
        // Buy all base from start of bonding curve.
        let reserves = pack_Reserves(get_BASE_VIRTUAL_CEILING(), get_QUOTE_VIRTUAL_FLOOR());
        let output = cpamm_simple_swap_output_amount(get_QUOTE_REAL_CEILING(), false, reserves);
        assert!(output == get_BASE_REAL_CEILING(), 0);
        // Sell all base to a bonding curve that is theoretically complete but has not transitioned.
        reserves = pack_Reserves(get_BASE_VIRTUAL_FLOOR(), get_QUOTE_VIRTUAL_CEILING());
        output = cpamm_simple_swap_output_amount(get_BASE_REAL_CEILING(), true, reserves);
        assert!(output == get_QUOTE_REAL_CEILING(), 0);
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_SWAP_DIVIDE_BY_ZERO,
        location = emojicoin_dot_fun
    )] fun cpamm_simple_swap_output_amount_divide_by_zero() {
        cpamm_simple_swap_output_amount(0, true, pack_Reserves(0, 16));
    }

    #[test] fun get_publish_code_expected() {
        let market_address = @0xabcdef0123456789;

        // Manually construct expected metadata bytecode.
        let split_metadata_bytes = get_split_metadata_bytes();
        let expected_metadata_bytecode = *vector::borrow(&split_metadata_bytes, 0);
        vector::append(&mut expected_metadata_bytecode, bcs::to_bytes(&@emojicoin_dot_fun));
        vector::append(&mut expected_metadata_bytecode, *vector::borrow(&split_metadata_bytes, 1));

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