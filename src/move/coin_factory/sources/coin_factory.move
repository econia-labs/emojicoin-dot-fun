module coin_factory::coin_factory {
    struct Emojicoin {}
    struct EmojicoinLP {}

    #[test_only] use aptos_std::type_info::{Self};
    #[test_only] use emojicoin_dot_fun::emojicoin_dot_fun;

    #[test]
    fun test_type_info_consts_correct() {
        let (module_name, emojicoin_struct, emojicoin_lp_struct) =
            emojicoin_dot_fun::get_COIN_FACTORY_TYPE_CONSTANTS();

        let emojicoin_type_info = type_info::type_of<Emojicoin>();
        let lp_type_info = type_info::type_of<EmojicoinLP>();

        assert!(@coin_factory == type_info::account_address(&emojicoin_type_info), 0);
        assert!(@coin_factory == type_info::account_address(&lp_type_info), 0);
        assert!(module_name == type_info::module_name(&emojicoin_type_info), 0);
        assert!(module_name == type_info::module_name(&lp_type_info), 0);
        assert!(emojicoin_struct == type_info::struct_name(&emojicoin_type_info), 0);
        assert!(emojicoin_lp_struct == type_info::struct_name(&lp_type_info), 0);
    }
}
